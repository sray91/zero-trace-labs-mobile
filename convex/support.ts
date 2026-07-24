import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser, getOrCreateCurrentUser } from "./users";
import type { Doc } from "./_generated/dataModel";

// The user's active (non-closed) conversation, newest first.
async function activeConversation(
  ctx: { db: any },
  userId: Doc<"users">["_id"]
): Promise<Doc<"supportConversations"> | null> {
  const conversations = await ctx.db
    .query("supportConversations")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const open = conversations.filter(
    (c: Doc<"supportConversations">) => c.status !== "closed"
  );
  open.sort((a: any, b: any) => b.lastMessageAt - a.lastMessageAt);
  return open[0] ?? null;
}

// Everything the chat widget needs, live via Convex reactivity.
export const forCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const conversation = await activeConversation(ctx, user._id);
    if (!conversation) return { conversation: null, messages: [] };
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversation._id)
      )
      .collect();
    return {
      conversation: { _id: conversation._id, status: conversation.status },
      messages: messages.map((m) => ({
        _id: m._id,
        role: m.role,
        text: m.text,
        authorName: m.authorName,
        sentAt: m.sentAt,
      })),
    };
  },
});

export const sendMessage = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Empty message");
    if (trimmed.length > 4000) throw new Error("Message too long");

    const user = await getOrCreateCurrentUser(ctx);
    let conversation = await activeConversation(ctx, user._id);
    if (!conversation) {
      const id = await ctx.db.insert("supportConversations", {
        userId: user._id,
        status: "bot",
        lastMessageAt: Date.now(),
      });
      conversation = (await ctx.db.get(id))!;
    }

    await ctx.db.insert("supportMessages", {
      conversationId: conversation._id,
      role: "user",
      text: trimmed,
      sentAt: Date.now(),
    });
    await ctx.db.patch(conversation._id, { lastMessageAt: Date.now() });

    // Mirror into the Slack thread so the team always has the full transcript.
    await ctx.scheduler.runAfter(0, internal.slack.postThreadMessage, {
      conversationId: conversation._id,
      text: trimmed,
      prefix: "👤",
    });

    // While the bot is handling the conversation, have it answer.
    if (conversation.status === "bot") {
      await ctx.scheduler.runAfter(0, internal.supportBot.reply, {
        conversationId: conversation._id,
      });
    }

    return conversation._id;
  },
});

// "Talk to a human" — flips the conversation out of bot mode and pings Slack.
export const requestHuman = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateCurrentUser(ctx);
    const conversation = await activeConversation(ctx, user._id);
    if (!conversation) return null;
    if (conversation.status === "human") return conversation._id;

    await ctx.db.patch(conversation._id, {
      status: "human",
      lastMessageAt: Date.now(),
    });
    await ctx.db.insert("supportMessages", {
      conversationId: conversation._id,
      role: "system",
      text: "You're now connected to our support team. Replies may take a little while — feel free to keep the chat open or check back later.",
      sentAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.slack.postThreadMessage, {
      conversationId: conversation._id,
      text: "🙋 The user asked to talk to a human. Reply in this thread and they'll see it in the app.",
      prefix: "",
    });
    return conversation._id;
  },
});

// ---- Internal API used by the bot action, the Slack action, and /slack-events ----

export const getConversationContext = internalQuery({
  args: { conversationId: v.id("supportConversations") },
  handler: async (ctx, { conversationId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return null;
    const user = await ctx.db.get(conversation.userId);
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();
    return {
      conversation,
      userEmail: user?.email ?? "unknown user",
      userName: user?.name,
      messages,
    };
  },
});

export const appendMessage = internalMutation({
  args: {
    conversationId: v.id("supportConversations"),
    role: v.string(),
    text: v.string(),
    authorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("supportMessages", { ...args, sentAt: Date.now() });
    await ctx.db.patch(args.conversationId, { lastMessageAt: Date.now() });
  },
});

export const setStatus = internalMutation({
  args: {
    conversationId: v.id("supportConversations"),
    status: v.string(),
  },
  handler: async (ctx, { conversationId, status }) => {
    await ctx.db.patch(conversationId, { status });
  },
});

export const setSlackThread = internalMutation({
  args: {
    conversationId: v.id("supportConversations"),
    slackChannelId: v.string(),
    slackThreadTs: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      slackChannelId: args.slackChannelId,
      slackThreadTs: args.slackThreadTs,
    });
  },
});

// Called by the /slack-events HTTP endpoint when a teammate replies in a thread.
export const receiveSlackReply = internalMutation({
  args: {
    slackThreadTs: v.string(),
    text: v.string(),
    authorName: v.optional(v.string()),
  },
  handler: async (ctx, { slackThreadTs, text, authorName }) => {
    const conversation = await ctx.db
      .query("supportConversations")
      .withIndex("by_slack_thread", (q) => q.eq("slackThreadTs", slackThreadTs))
      .unique();
    if (!conversation) return;

    await ctx.db.insert("supportMessages", {
      conversationId: conversation._id,
      role: "agent",
      text,
      authorName: authorName ?? "Support",
      sentAt: Date.now(),
    });
    // A human replied — stop the bot from answering further messages.
    await ctx.db.patch(conversation._id, {
      status: "human",
      lastMessageAt: Date.now(),
    });
  },
});
