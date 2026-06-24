import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireCurrentUser } from "./users";

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("brokerExposures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Upsert a single exposure row (one per user + data source).
export const upsert = mutation({
  args: {
    dataSourceId: v.id("dataSources"),
    exposureStatus: v.optional(v.string()),
    removalStatus: v.optional(v.string()),
    listingUrl: v.optional(v.string()),
    confirmationRef: v.optional(v.string()),
    checklist: v.optional(v.any()),
    foundAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    removedAt: v.optional(v.number()),
    recheckAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const { dataSourceId, ...patch } = args;

    const existing = await ctx.db
      .query("brokerExposures")
      .withIndex("by_user_and_source", (q) =>
        q.eq("userId", user._id).eq("dataSourceId", dataSourceId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return (await ctx.db.get(existing._id))!;
    }

    const id = await ctx.db.insert("brokerExposures", {
      userId: user._id,
      dataSourceId,
      exposureStatus: patch.exposureStatus ?? "unchecked",
      removalStatus: patch.removalStatus ?? "not_started",
      listingUrl: patch.listingUrl,
      confirmationRef: patch.confirmationRef,
      checklist: patch.checklist,
      foundAt: patch.foundAt,
      submittedAt: patch.submittedAt,
      removedAt: patch.removedAt,
      recheckAt: patch.recheckAt,
      notes: patch.notes,
    });
    return (await ctx.db.get(id))!;
  },
});
