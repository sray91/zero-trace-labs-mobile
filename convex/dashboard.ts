import { query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { Doc } from "./_generated/dataModel";

// How far each removalStatus sits in the Search → Find → Submit → Verify funnel
// (0–4). Mirrors STATUS_META on the admin user page. Anything unrecognized = 0.
const STATUS_REACHED: Record<string, number> = {
  not_started: 0,
  searched_not_found: 1,
  searched_found: 2,
  submitted: 3,
  removed: 4,
  reappeared: 2,
  handled_by_service: 4,
  skipped: 0,
};

// The funnel stage (0–4) a broker has reached for this user. Derived from *every*
// signal, not removalStatus alone — recording a search sets searchedAt/exposureStatus
// but leaves removalStatus 'not_started', so a status-only reading under-counts
// "Searched". Each higher stage implies the lower ones, so the funnel stays monotonic.
function stageReached(e: Doc<"brokerExposures"> | undefined): number {
  if (!e) return 0;
  let r = STATUS_REACHED[e.removalStatus ?? "not_started"] ?? 0;
  if (e.verifiedRemoved || e.removedAt) r = Math.max(r, 4);
  if (e.submittedAt) r = Math.max(r, 3);
  if (e.exposureStatus === "found" || e.foundAt) r = Math.max(r, 2);
  if (e.searchedAt || (e.exposureStatus && e.exposureStatus !== "unchecked"))
    r = Math.max(r, 1);
  return r;
}

// Read-only progress dashboard for the signed-in user (the "📊 Dashboard" tab).
// Joins the broker catalog with the user's per-broker removal state and reports it
// as a cumulative Search → Verify funnel.
export const forCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    const brokers = await ctx.db
      .query("dataSources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const exposuresBySource = new Map<string, Doc<"brokerExposures">>();
    let lastUpdated: number | undefined;
    const bump = (t?: number) => {
      if (t && (lastUpdated === undefined || t > lastUpdated)) lastUpdated = t;
    };
    if (user) {
      const exposures = await ctx.db
        .query("brokerExposures")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const e of exposures) {
        exposuresBySource.set(e.dataSourceId, e);
        bump(e._creationTime);
        bump(e.searchedAt);
        bump(e.submittedAt);
        bump(e.removedAt);
      }
    }

    const total = brokers.length;
    const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

    // tier -> cumulative funnel { searched, found, submitted, removed }
    const tierFunnel: Record<number, { searched: number; found: number; submitted: number; removed: number }> = {
      1: { searched: 0, found: 0, submitted: 0, removed: 0 },
      2: { searched: 0, found: 0, submitted: 0, removed: 0 },
      3: { searched: 0, found: 0, submitted: 0, removed: 0 },
    };
    // category -> { count, removed }
    const categoryAgg = new Map<string, { count: number; removed: number }>();
    const funnel = { total, searched: 0, found: 0, submitted: 0, removed: 0 };
    const tier1: Array<{
      name: string;
      optOutUrl?: string;
      difficulty?: string;
      estProcessingDays?: number;
      status: string;
      stage: number;
      submittedAt?: number;
      verified: boolean;
    }> = [];

    for (const broker of brokers) {
      const tier = broker.tier ?? 3;
      const category = broker.category ?? "Uncategorized";
      const exposure = exposuresBySource.get(broker._id);
      const stage = stageReached(exposure);
      const status = exposure?.removalStatus ?? "not_started";

      tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
      const tf = tierFunnel[tier] ?? (tierFunnel[tier] = { searched: 0, found: 0, submitted: 0, removed: 0 });
      if (stage >= 1) { funnel.searched++; tf.searched++; }
      if (stage >= 2) { funnel.found++; tf.found++; }
      if (stage >= 3) { funnel.submitted++; tf.submitted++; }
      if (stage >= 4) { funnel.removed++; tf.removed++; }

      const cat = categoryAgg.get(category) ?? { count: 0, removed: 0 };
      cat.count += 1;
      if (stage >= 4) cat.removed += 1;
      categoryAgg.set(category, cat);

      if (tier === 1) {
        tier1.push({
          name: broker.name,
          optOutUrl: broker.optOutUrl,
          difficulty: broker.difficulty,
          estProcessingDays: broker.estProcessingDays,
          status,
          stage,
          submittedAt: exposure?.submittedAt,
          verified: stage >= 4,
        });
      }
    }

    const notStarted = total - funnel.searched;
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

    const byTier = [1, 2, 3].map((tier) => {
      const tf = tierFunnel[tier] ?? { searched: 0, found: 0, submitted: 0, removed: 0 };
      const t = tierCounts[tier] ?? 0;
      return {
        tier,
        total: t,
        notStarted: t - tf.searched,
        searched: tf.searched,
        found: tf.found,
        submitted: tf.submitted,
        removed: tf.removed,
      };
    });

    const byCategory = Array.from(categoryAgg.entries())
      .map(([category, { count, removed }]) => ({
        category,
        count,
        removed,
        pct: count === 0 ? 0 : Math.round((removed / count) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    tier1.sort((a, b) => a.name.localeCompare(b.name));

    return {
      total,
      tierCounts,
      funnel,
      summary: {
        notStarted,
        searched: funnel.searched,
        found: funnel.found,
        submitted: funnel.submitted,
        // submitted opt-outs still awaiting confirmation (stage exactly 3)
        submittedAwaiting: funnel.submitted - funnel.removed,
        removed: funnel.removed,
      },
      completion: {
        removedPct: pct(funnel.removed),
        submittedPct: pct(funnel.submitted),
        notStartedPct: pct(notStarted),
      },
      byTier,
      byCategory,
      tier1,
      lastUpdated,
    };
  },
});
