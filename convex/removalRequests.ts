import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireCurrentUser } from "./users";

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const rows = await ctx.db
      .query("removalRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Hydrate the linked data source (mirrors the old Supabase join).
    return await Promise.all(
      rows.map(async (row) => ({
        ...row,
        dataSource: row.dataSourceId
          ? await ctx.db.get(row.dataSourceId)
          : null,
      }))
    );
  },
});

export const add = mutation({
  args: {
    dataSourceId: v.optional(v.id("dataSources")),
    fullName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db.insert("removalRequests", {
      userId: user._id,
      dataSourceId: args.dataSourceId,
      fullName: args.fullName,
      phone: args.phone,
      email: args.email,
      status: args.status ?? "pending",
      notes: args.notes,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("removalRequests"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const row = await ctx.db.get(args.id);
    if (!row || row.userId !== user._id) throw new Error("Not found");
    await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
    });
  },
});
