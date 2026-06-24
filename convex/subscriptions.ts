import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

const FREE = { plan: "free", planLabel: "Free Plan", isPaid: false } as const;

// Returns the current user's entitlement, replacing the old Whop /api/whop/plan route.
export const getEntitlement = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { ...FREE };

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!sub || !sub.isPaid) return { ...FREE };

    return {
      plan: sub.plan || "paid",
      planLabel: sub.planLabel || "Paid Plan",
      isPaid: true,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd ?? null,
    };
  },
});

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

// Called by the RevenueCat webhook (convex/http.ts). Keyed by app_user_id == Clerk id.
export const upsertFromRevenueCat = internalMutation({
  args: {
    revenueCatAppUserId: v.string(),
    status: v.string(),
    plan: v.string(),
    planLabel: v.string(),
    entitlementId: v.optional(v.string()),
    productId: v.optional(v.string()),
    store: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const isPaid = ACTIVE_STATUSES.has(args.status.toLowerCase());

    // app_user_id is the Clerk id; link to the Convex user if it exists yet.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.revenueCatAppUserId)
      )
      .unique();

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_rc_app_user_id", (q) =>
        q.eq("revenueCatAppUserId", args.revenueCatAppUserId)
      )
      .unique();

    const doc = {
      userId: user?._id,
      revenueCatAppUserId: args.revenueCatAppUserId,
      status: args.status,
      isPaid,
      plan: isPaid ? args.plan : "free",
      planLabel: isPaid ? args.planLabel : "Free Plan",
      provider: "revenuecat",
      entitlementId: args.entitlementId,
      productId: args.productId,
      store: args.store,
      currentPeriodEnd: args.currentPeriodEnd,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("subscriptions", doc);
  },
});
