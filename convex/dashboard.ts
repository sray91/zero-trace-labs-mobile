import { query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { Doc } from "./_generated/dataModel";

// Removal-status buckets the dashboard reports on (mirrors the spreadsheet's
// "Status Breakdown by Tier" columns). Anything unrecognized counts as not_started.
const NOT_STARTED = "not_started";

function statusOf(exposure: Doc<"brokerExposures"> | undefined): string {
  return exposure?.removalStatus ?? NOT_STARTED;
}

// Read-only progress dashboard for the signed-in user (the "📊 Dashboard" tab).
// Joins the broker catalog with the user's per-broker removal state.
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
    if (user) {
      const exposures = await ctx.db
        .query("brokerExposures")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const e of exposures) {
        exposuresBySource.set(e.dataSourceId, e);
        const t = e._creationTime;
        if (lastUpdated === undefined || t > lastUpdated) lastUpdated = t;
      }
    }

    const total = brokers.length;
    const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

    // tier -> status -> count
    const tierStatus: Record<number, Record<string, number>> = {
      1: {},
      2: {},
      3: {},
    };
    // category -> { count, removed }
    const categoryAgg = new Map<string, { count: number; removed: number }>();
    const statusCounts: Record<string, number> = {};
    const tier1: Array<{
      name: string;
      optOutUrl?: string;
      difficulty?: string;
      estProcessingDays?: number;
      status: string;
      submittedAt?: number;
      verified: boolean;
    }> = [];

    for (const broker of brokers) {
      const tier = broker.tier ?? 3;
      const category = broker.category ?? "Uncategorized";
      const exposure = exposuresBySource.get(broker._id);
      const status = statusOf(exposure);

      tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
      tierStatus[tier] = tierStatus[tier] ?? {};
      tierStatus[tier][status] = (tierStatus[tier][status] ?? 0) + 1;
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;

      const cat = categoryAgg.get(category) ?? { count: 0, removed: 0 };
      cat.count += 1;
      if (status === "removed") cat.removed += 1;
      categoryAgg.set(category, cat);

      if (tier === 1) {
        tier1.push({
          name: broker.name,
          optOutUrl: broker.optOutUrl,
          difficulty: broker.difficulty,
          estProcessingDays: broker.estProcessingDays,
          status,
          submittedAt: exposure?.submittedAt,
          verified: status === "removed",
        });
      }
    }

    const removed = statusCounts["removed"] ?? 0;
    const submitted = statusCounts["submitted"] ?? 0;
    const notStarted = statusCounts[NOT_STARTED] ?? 0;
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

    const byTier = [1, 2, 3].map((tier) => {
      const s = tierStatus[tier] ?? {};
      return {
        tier,
        total: tierCounts[tier] ?? 0,
        notStarted: s[NOT_STARTED] ?? 0,
        searchedFound: s["searched_found"] ?? 0,
        submitted: s["submitted"] ?? 0,
        removed: s["removed"] ?? 0,
        handledByService: s["handled_by_service"] ?? 0,
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
      statusCounts,
      summary: {
        removed,
        submitted,
        notStarted,
        handledByService: statusCounts["handled_by_service"] ?? 0,
        searchedFound: statusCounts["searched_found"] ?? 0,
      },
      completion: {
        removedPct: pct(removed),
        submittedPct: pct(submitted),
        notStartedPct: pct(notStarted),
      },
      byTier,
      byCategory,
      tier1,
      lastUpdated,
    };
  },
});
