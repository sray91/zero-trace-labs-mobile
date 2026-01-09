import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

/**
 * Get subscription by Clerk ID (for mobile app)
 */
export const getByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("subscriptions")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

/**
 * Upsert subscription from RevenueCat webhook
 */
export const upsertFromRevenueCat = internalMutation({
    args: {
        clerkId: v.string(),
        status: v.union(
            v.literal("none"),
            v.literal("active"),
            v.literal("trialing"),
            v.literal("past_due"),
            v.literal("cancelled"),
            v.literal("expired")
        ),
        planId: v.optional(v.string()),
        planName: v.optional(v.string()),
        providerSubscriptionId: v.optional(v.string()),
        providerCustomerId: v.optional(v.string()),
        hasAppAccess: v.boolean(),
        currentPeriodStart: v.optional(v.number()),
        currentPeriodEnd: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Find the user by Clerk ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            // User doesn't exist yet - create them first
            const now = Date.now();
            const userId = await ctx.db.insert("users", {
                clerkId: args.clerkId,
                createdAt: now,
                updatedAt: now,
            });

            // Create subscription
            return await ctx.db.insert("subscriptions", {
                userId,
                clerkId: args.clerkId,
                status: args.status,
                planId: args.planId,
                planName: args.planName,
                provider: "revenuecat",
                providerSubscriptionId: args.providerSubscriptionId,
                providerCustomerId: args.providerCustomerId,
                hasAppAccess: args.hasAppAccess,
                currentPeriodStart: args.currentPeriodStart,
                currentPeriodEnd: args.currentPeriodEnd,
                createdAt: now,
                updatedAt: now,
            });
        }

        // Check if subscription exists
        const existingSub = await ctx.db
            .query("subscriptions")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();

        const now = Date.now();

        if (existingSub) {
            await ctx.db.patch(existingSub._id, {
                status: args.status,
                planId: args.planId,
                planName: args.planName,
                providerSubscriptionId: args.providerSubscriptionId,
                providerCustomerId: args.providerCustomerId,
                hasAppAccess: args.hasAppAccess,
                currentPeriodStart: args.currentPeriodStart,
                currentPeriodEnd: args.currentPeriodEnd,
                updatedAt: now,
            });
            return existingSub._id;
        } else {
            return await ctx.db.insert("subscriptions", {
                userId: user._id,
                clerkId: args.clerkId,
                status: args.status,
                planId: args.planId,
                planName: args.planName,
                provider: "revenuecat",
                providerSubscriptionId: args.providerSubscriptionId,
                providerCustomerId: args.providerCustomerId,
                hasAppAccess: args.hasAppAccess,
                currentPeriodStart: args.currentPeriodStart,
                currentPeriodEnd: args.currentPeriodEnd,
                createdAt: now,
                updatedAt: now,
            });
        }
    },
});
