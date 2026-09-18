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

const HUMAN_HANDOFF_TEXT =
  "You're now connected to our support team. Replies may take a little while — feel free to keep the chat open or check back later.";

// Consent to the AI assistant, as the client needs to see it:
//   "unset" -> show the disclosure before anything is sent to Anthropic
//   "granted" | "declined" -> the user has answered; Settings can change it
function consentState(user: Doc<"users">): "granted" | "declined" | "unset" {
  if (user.aiSupportConsent === true) return "granted";
  if (user.aiSupportConsent === false) return "declined";
  return "unset";
}

// Take a conversation out of bot mode (or start it there) and tell both the user
// and the team that a person will answer.
async function handOffToHuman(
  ctx: any,
  conversationId: Doc<"supportConversations">["_id"],
  slackNote: string
) {
  await ctx.db.patch(conversationId, {
    status: "human",
    lastMessageAt: Date.now(),
  });
  await ctx.db.insert("supportMessages", {
    conversationId,
    role: "system",
    text: HUMAN_HANDOFF_TEXT,
    sentAt: Date.now(),
  });
  // Delayed by a second so it lands after any message mirrored in the same
  // mutation — the first post for a conversation creates the Slack thread, and
  // two concurrent posts would create two.
  await ctx.scheduler.runAfter(1000, internal.slack.postThreadMessage, {
    conversationId,
    text: slackNote,
    prefix: "",
  });
}

// Everything the chat widget needs, live via Convex reactivity.
export const forCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    // No user row yet (first session, before the Clerk webhook lands): the chat is
    // still usable — sendMessage creates the row — so report an empty, unconsented
    // conversation rather than null, which the client would read as "still loading".
    if (!user) return { conversation: null, messages: [], aiConsent: "unset" };
    const aiConsent = consentState(user);
    const conversation = await activeConversation(ctx, user._id);
    if (!conversation) return { conversation: null, messages: [], aiConsent };
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversation._id)
      )
      .collect();
    return {
      aiConsent,
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
    // The single gate on the third-party AI service. Without recorded consent the
    // assistant is never called and the conversation is handled by a person.
    const aiConsent = user.aiSupportConsent === true;
    let conversation = await activeConversation(ctx, user._id);
    const isNewConversation = !conversation;
    if (!conversation) {
      const id = await ctx.db.insert("supportConversations", {
        userId: user._id,
        status: aiConsent ? "bot" : "human",
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

    if (conversation.status === "bot" && aiConsent) {
      // Consented and in bot mode — the assistant answers (this is the only path
      // that reaches Anthropic; see convex/supportBot.ts).
      await ctx.scheduler.runAfter(0, internal.supportBot.reply, {
        conversationId: conversation._id,
      });
    } else if (conversation.status === "bot") {
      // Consent was withdrawn while a bot conversation was open.
      await handOffToHuman(
        ctx,
        conversation._id,
        "🙋 The user turned off the AI assistant. Reply in this thread and they'll see it in the app."
      );
    } else if (isNewConversation) {
      await handOffToHuman(
        ctx,
        conversation._id,
        "🙋 The user has not enabled the AI assistant, so this conversation starts with the team. Reply in this thread and they'll see it in the app."
      );
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

    await handOffToHuman(
      ctx,
      conversation._id,
      "🙋 The user asked to talk to a human. Reply in this thread and they'll see it in the app."
    );
    return conversation._id;
  },
});

// ---- AI assistant consent (App Store Guidelines 5.1.1(i) / 5.1.2(i)) ----

// Read by the Support chat (to decide whether to show the disclosure) and by
// Settings (to render the toggle).
export const aiConsent = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { state: "unset" as const, grantedAt: null };
    return {
      state: consentState(user),
      grantedAt: user.aiSupportConsentAt ?? null,
    };
  },
});

// Records the user's answer to the disclosure. Granting is the only thing that
// ever lets a support message reach Anthropic; withdrawing takes effect
// immediately, including for a conversation the assistant is already handling.
export const setAiConsent = mutation({
  args: { granted: v.boolean() },
  handler: async (ctx, { granted }) => {
    const user = await getOrCreateCurrentUser(ctx);
    await ctx.db.patch(user._id, {
      aiSupportConsent: granted,
      aiSupportConsentAt: Date.now(),
    });

    if (!granted) {
      const conversation = await activeConversation(ctx, user._id);
      if (conversation && conversation.status === "bot") {
        await handOffToHuman(
          ctx,
          conversation._id,
          "🙋 The user turned off the AI assistant. Reply in this thread and they'll see it in the app."
        );
      }
    }

    return granted;
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
      // Slack only: the transcript sent to Anthropic never includes these.
      userEmail: user?.email ?? "unknown user",
      userName: user?.name,
      aiConsent: user?.aiSupportConsent === true,
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

    // Human replies can arrive long after the user left the chat, so push.
    // (Bot replies land in seconds while the user is watching — no push there.)
    await ctx.scheduler.runAfter(0, internal.pushNotifications.sendToUser, {
      userId: conversation.userId,
      title: authorName ? `${authorName} (0TraceLabs Support)` : "Support replied",
      body: text.length > 140 ? `${text.slice(0, 137)}...` : text,
      data: { screen: "support-chat" },
    });
  },
});
