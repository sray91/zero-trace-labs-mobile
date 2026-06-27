import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { requireAdmin } from "./users";

// Canonical people-search brokers the baseline scan attaches results to. The
// Apify skip-trace aggregates the same data these Tier-1 sites expose, so we
// record one exposure per broker. We only touch catalog rows that actually
// exist (matched by name); if none match we fall back to a few Tier-1 rows so
// the scan still aligns with real Master Tracker entities.
const TARGET_BROKER_NAMES = [
  "BeenVerified",
  "Spokeo",
  "Whitepages",
  "TruePeopleSearch",
  "Radaris",
];

// Resolve the PII + target brokers for a scan. Admin only (auth forwards from
// the calling action). Throws before any Apify spend if the caller isn't admin.
export const getScanContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const active = await ctx.db
      .query("dataSources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const wanted = new Set(TARGET_BROKER_NAMES.map((n) => n.toLowerCase()));
    let targets = active.filter((b) => wanted.has(b.name.toLowerCase()));
    if (targets.length === 0) {
      targets = active.filter((b) => (b.tier ?? 3) === 1).slice(0, 5);
    }

    return {
      name: user.name,
      email: user.email,
      profile,
      targets: targets.map((t) => ({ _id: t._id, name: t.name })),
    };
  },
});

// Persist a baseline scan: one searchHistory row (raw results) plus a
// brokerExposures upsert per target broker, filling the Search Log columns
// (searchedAt / Data Found? / What Was Found / Profile URL / Action Taken).
export const persistScan = internalMutation({
  args: {
    userId: v.id("users"),
    targetSourceIds: v.array(v.id("dataSources")),
    searchTerm: v.string(),
    recordCount: v.number(),
    categories: v.array(v.string()),
    personLink: v.optional(v.string()),
    rawResults: v.any(),
    fullName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const found = args.recordCount > 0;
    const action = "Baseline scan (Apify skip trace)";
    const whatWasFound = found
      ? `${args.recordCount} record(s) — ${args.categories.join(", ")}`
      : undefined;

    // 1. Raw scan results -> the user's search log.
    await ctx.db.insert("searchHistory", {
      userId: args.userId,
      fullName: args.fullName,
      phone: args.phone,
      email: args.email,
      results: args.rawResults,
    });

    // 2. Per-broker exposure rows aligned with the Master Tracker / Search Log.
    let brokersUpdated = 0;
    for (const dataSourceId of args.targetSourceIds) {
      const existing = await ctx.db
        .query("brokerExposures")
        .withIndex("by_user_and_source", (q) =>
          q.eq("userId", args.userId).eq("dataSourceId", dataSourceId)
        )
        .unique();

      const current = existing?.removalStatus ?? "not_started";
      // Only advance triage status; never roll back a user who's already past it
      // (submitted / removed / handled_by_service / skipped stay put).
      let removalStatus: string | undefined;
      if (found && (current === "not_started" || current === "searched_not_found")) {
        removalStatus = "searched_found";
      } else if (!found && current === "not_started") {
        removalStatus = "searched_not_found";
      }

      const patch: Record<string, unknown> = {
        exposureStatus: found ? "found" : "not_found",
        searchedAt: now,
        searchTerm: args.searchTerm,
        whatWasFound,
        actionTaken: action,
      };
      if (removalStatus) patch.removalStatus = removalStatus;
      if (found) {
        patch.foundAt = existing?.foundAt ?? now;
        if (args.personLink) patch.listingUrl = existing?.listingUrl ?? args.personLink;
      }

      if (existing) {
        await ctx.db.patch(existing._id, patch);
      } else {
        await ctx.db.insert("brokerExposures", {
          userId: args.userId,
          dataSourceId,
          exposureStatus: found ? "found" : "not_found",
          removalStatus: removalStatus ?? "not_started",
          searchedAt: now,
          searchTerm: args.searchTerm,
          whatWasFound,
          actionTaken: action,
          foundAt: found ? now : undefined,
          listingUrl: found ? args.personLink : undefined,
        });
      }
      brokersUpdated++;
    }

    return { found, recordCount: args.recordCount, brokersUpdated };
  },
});
