import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users table - synced from Clerk via webhook
    users: defineTable({
        clerkId: v.string(),
        email: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"]),

    // Subscriptions table - synced from RevenueCat via webhook
    subscriptions: defineTable({
        userId: v.id("users"),
        clerkId: v.string(), // Denormalized for easy lookup
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
        provider: v.string(), // "revenuecat"
        providerSubscriptionId: v.optional(v.string()),
        providerCustomerId: v.optional(v.string()),
        hasAppAccess: v.boolean(),
        currentPeriodStart: v.optional(v.number()),
        currentPeriodEnd: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_clerk_id", ["clerkId"])
        .index("by_provider_subscription_id", ["providerSubscriptionId"]),
});
