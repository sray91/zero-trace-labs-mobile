import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

/**
 * Get user by Clerk ID
 */
export const getByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

/**
 * Create or update user from Clerk webhook
 */
export const upsertFromClerk = internalMutation({
    args: {
        clerkId: v.string(),
        email: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const now = Date.now();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                email: args.email,
                firstName: args.firstName,
                lastName: args.lastName,
                imageUrl: args.imageUrl,
                updatedAt: now,
            });
            return existingUser._id;
        } else {
            return await ctx.db.insert("users", {
                clerkId: args.clerkId,
                email: args.email,
                firstName: args.firstName,
                lastName: args.lastName,
                imageUrl: args.imageUrl,
                createdAt: now,
                updatedAt: now,
            });
        }
    },
});

/**
 * Delete user (for Clerk webhook when user is deleted)
 */
export const deleteByClerkId = internalMutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (user) {
            // Also delete their subscription
            const subscription = await ctx.db
                .query("subscriptions")
                .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                .first();

            if (subscription) {
                await ctx.db.delete(subscription._id);
            }

            await ctx.db.delete(user._id);
        }
    },
});
