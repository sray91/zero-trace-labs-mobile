import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./users";
import { Doc, Id } from "./_generated/dataModel";

// ---- Users overview ----

// List every user with their profile and a progress summary. Admin only.
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const brokers = await ctx.db
      .query("dataSources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    const totalBrokers = brokers.length;

    const users = await ctx.db.query("users").collect();

    const rows = await Promise.all(
      users.map(async (user) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();

        const exposures = await ctx.db
          .query("brokerExposures")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        let removed = 0;
        let submitted = 0;
        for (const e of exposures) {
          if (e.removalStatus === "removed") removed++;
          else if (e.removalStatus === "submitted") submitted++;
        }

        const openTasks = (
          await ctx.db
            .query("userTasks")
            .withIndex("by_user_and_status", (q) =>
              q.eq("userId", user._id).eq("status", "open")
            )
            .collect()
        ).length;

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          role: user.role,
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          welcomeCompleted: profile?.welcomeCompleted ?? false,
          totalBrokers,
          removed,
          submitted,
          openTasks,
          progressPct:
            totalBrokers === 0 ? 0 : Math.round((removed / totalBrokers) * 100),
        };
      })
    );

    rows.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
    return rows;
  },
});

// Full detail for one user: profile, every broker joined with the user's exposure,
// and the user's task list. Admin only.
export const getUserDetail = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const brokers = await ctx.db
      .query("dataSources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const exposures = await ctx.db
      .query("brokerExposures")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const exposureBySource = new Map<string, Doc<"brokerExposures">>();
    for (const e of exposures) exposureBySource.set(e.dataSourceId, e);

    const records = brokers
      .map((broker) => ({
        broker,
        exposure: exposureBySource.get(broker._id) ?? null,
      }))
      .sort((a, b) => {
        const t = (a.broker.tier ?? 3) - (b.broker.tier ?? 3);
        return t !== 0 ? t : a.broker.name.localeCompare(b.broker.name);
      });

    const tasks = await ctx.db
      .query("userTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    tasks.sort((a, b) => b._creationTime - a._creationTime);

    return { user, profile, records, tasks };
  },
});

// ---- Mutations: edit on behalf of a user ----

// Admin variant of brokerExposures.upsert that takes an explicit userId.
export const setExposure = mutation({
  args: {
    userId: v.id("users"),
    dataSourceId: v.id("dataSources"),
    exposureStatus: v.optional(v.string()),
    removalStatus: v.optional(v.string()),
    listingUrl: v.optional(v.string()),
    confirmationRef: v.optional(v.string()),
    foundAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    removedAt: v.optional(v.number()),
    recheckAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { userId, dataSourceId, ...patch } = args;

    const existing = await ctx.db
      .query("brokerExposures")
      .withIndex("by_user_and_source", (q) =>
        q.eq("userId", userId).eq("dataSourceId", dataSourceId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("brokerExposures", {
      userId,
      dataSourceId,
      exposureStatus: patch.exposureStatus ?? "unchecked",
      removalStatus: patch.removalStatus ?? "not_started",
      listingUrl: patch.listingUrl,
      confirmationRef: patch.confirmationRef,
      foundAt: patch.foundAt,
      submittedAt: patch.submittedAt,
      removedAt: patch.removedAt,
      recheckAt: patch.recheckAt,
      notes: patch.notes,
    });
  },
});

// ---- Tasks ----

export const createTask = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    relatedDataSourceId: v.optional(v.id("dataSources")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    return await ctx.db.insert("userTasks", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      status: "open",
      priority: args.priority,
      dueDate: args.dueDate,
      relatedDataSourceId: args.relatedDataSourceId,
      createdByClerkId: admin.clerkId,
    });
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("userTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { taskId, ...patch } = args;
    const cleaned: Record<string, unknown> = { ...patch };
    if (patch.status === "done") cleaned.completedAt = Date.now();
    if (patch.status && patch.status !== "done") cleaned.completedAt = undefined;
    await ctx.db.patch(taskId, cleaned);
    return taskId;
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("userTasks") },
  handler: async (ctx, { taskId }: { taskId: Id<"userTasks"> }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(taskId);
  },
});
