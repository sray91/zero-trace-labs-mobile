import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireCurrentUser } from "./users";

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    fullName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    results: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db.insert("searchHistory", { userId: user._id, ...args });
  },
});
