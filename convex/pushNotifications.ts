import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireCurrentUser } from "./users";

// ---- Device token registration (called from the mobile app) ----

export const registerToken = mutation({
  args: {
    token: v.string(),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (existing) {
      // Re-associate the device if a different account signs in on it.
      await ctx.db.patch(existing._id, {
        userId: user._id,
        platform: args.platform,
        updatedAt: Date.now(),
      });
      return;
    }
    await ctx.db.insert("pushTokens", {
      userId: user._id,
      token: args.token,
      platform: args.platform,
      updatedAt: Date.now(),
    });
  },
});

export const unregisterToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (existing && existing.userId === user._id) {
      await ctx.db.delete(existing._id);
    }
  },
});

// ---- Internal helpers ----

export const tokensForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return rows.map((r) => r.token);
  },
});

export const deleteTokens = internalMutation({
  args: { tokens: v.array(v.string()) },
  handler: async (ctx, args) => {
    for (const token of args.tokens) {
      const row = await ctx.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
      if (row) await ctx.db.delete(row._id);
    }
  },
});

export const listUserIdsWithTokens = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("pushTokens").collect();
    return [...new Set(rows.map((r) => r.userId))];
  },
});

// Progress snapshot for the weekly report push. Compact version of
// dashboard.forCurrentUser, keyed by an explicit userId so the cron can run it.
export const weeklyStatsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const brokers = await ctx.db
      .query("dataSources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    const exposures = await ctx.db
      .query("brokerExposures")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let removed = 0;
    let submitted = 0;
    let removedThisWeek = 0;
    let submittedThisWeek = 0;
    for (const e of exposures) {
      if (e.removalStatus === "removed") removed++;
      else if (e.removalStatus === "submitted") submitted++;
      if (e.removedAt && e.removedAt >= weekAgo) removedThisWeek++;
      if (e.submittedAt && e.submittedAt >= weekAgo) submittedThisWeek++;
    }
    return {
      total: brokers.length,
      removed,
      submitted,
      removedThisWeek,
      submittedThisWeek,
    };
  },
});

// ---- Sending ----

type ExpoPushTicket = {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
};

// POST to the Expo push service and prune tokens Expo says are dead.
async function pushToExpo(
  ctx: { runMutation: (ref: any, args: any) => Promise<any> },
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const dead: string[] = [];
  // Expo accepts up to 100 messages per request.
  for (let i = 0; i < tokens.length; i += 100) {
    const chunk = tokens.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(
        chunk.map((to) => ({ to, title, body, sound: "default", data }))
      ),
    });
    if (!res.ok) {
      console.error("Expo push request failed", res.status, await res.text());
      continue;
    }
    const json = (await res.json()) as { data?: ExpoPushTicket[] };
    (json.data ?? []).forEach((ticket, idx) => {
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        dead.push(chunk[idx]);
      }
    });
  }
  if (dead.length) {
    await ctx.runMutation(internal.pushNotifications.deleteTokens, {
      tokens: dead,
    });
  }
}

// Send one notification to every registered device of a user. Scheduled from
// mutations via ctx.scheduler.runAfter(0, ...).
export const sendToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(internal.pushNotifications.tokensForUser, {
      userId: args.userId,
    });
    if (tokens.length === 0) return;
    await pushToExpo(ctx, tokens, args.title, args.body, args.data);
  },
});

// Weekly progress report, fired by convex/crons.ts for every user that has at
// least one registered device.
export const sendWeeklyReports = internalAction({
  args: {},
  handler: async (ctx) => {
    const userIds: Id<"users">[] = await ctx.runQuery(
      internal.pushNotifications.listUserIdsWithTokens,
      {}
    );
    for (const userId of userIds) {
      const stats = await ctx.runQuery(
        internal.pushNotifications.weeklyStatsForUser,
        { userId }
      );
      const parts = [
        `${stats.removed} of ${stats.total} brokers cleared`,
        `${stats.submitted} removal${stats.submitted === 1 ? "" : "s"} in progress`,
      ];
      if (stats.removedThisWeek > 0) {
        parts.push(`${stats.removedThisWeek} removed this week`);
      } else if (stats.submittedThisWeek > 0) {
        parts.push(`${stats.submittedThisWeek} submitted this week`);
      }
      const tokens = await ctx.runQuery(
        internal.pushNotifications.tokensForUser,
        { userId }
      );
      if (tokens.length === 0) continue;
      await pushToExpo(
        ctx,
        tokens,
        "Your weekly privacy report",
        parts.join(" • "),
        { screen: "dashboard" }
      );
    }
  },
});
