import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Outbound half of the Slack bridge. Each support conversation maps to one thread
// in SLACK_SUPPORT_CHANNEL; the parent message is created lazily on the first post.
// Inbound (team replies) arrives at the /slack-events endpoint in http.ts.
//
// Convex env vars required:
//   SLACK_BOT_TOKEN       xoxb-... (scopes: chat:write; users:read for reply names)
//   SLACK_SUPPORT_CHANNEL channel ID (e.g. C0123456789) the bot is invited to
// If they're unset the bridge is silently skipped so the in-app chat still works.

async function slackApi(method: string, body: Record<string, unknown>) {
  const token = process.env.SLACK_BOT_TOKEN;
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as any;
  if (!data.ok) {
    throw new Error(`Slack ${method} failed: ${data.error}`);
  }
  return data;
}

export const postThreadMessage = internalAction({
  args: {
    conversationId: v.id("supportConversations"),
    text: v.string(),
    // Emoji tag telling the team who wrote it (👤 user, 🤖 bot, "" for notices).
    prefix: v.string(),
  },
  handler: async (ctx, { conversationId, text, prefix }) => {
    const token = process.env.SLACK_BOT_TOKEN;
    const channel = process.env.SLACK_SUPPORT_CHANNEL;
    if (!token || !channel) {
      console.warn("Slack bridge not configured (SLACK_BOT_TOKEN / SLACK_SUPPORT_CHANNEL); skipping mirror");
      return;
    }

    const context = await ctx.runQuery(internal.support.getConversationContext, {
      conversationId,
    });
    if (!context) return;

    let threadTs = context.conversation.slackThreadTs;
    let threadChannel = context.conversation.slackChannelId ?? channel;

    // First post for this conversation: create the parent message.
    if (!threadTs) {
      const who = context.userName
        ? `${context.userName} (${context.userEmail})`
        : context.userEmail;
      const parent = await slackApi("chat.postMessage", {
        channel,
        text: `💬 New support conversation with *${who}*. Replies in this thread are shown to the user in the app.`,
      });
      threadTs = parent.ts as string;
      threadChannel = parent.channel as string;
      await ctx.runMutation(internal.support.setSlackThread, {
        conversationId,
        slackChannelId: threadChannel,
        slackThreadTs: threadTs,
      });
    }

    await slackApi("chat.postMessage", {
      channel: threadChannel,
      thread_ts: threadTs,
      text: prefix ? `${prefix} ${text}` : text,
    });
  },
});

// Inbound half: scheduled by /slack-events (http.ts) so the webhook can ack Slack
// within its 3s deadline. Resolves the agent's display name, then stores the reply.
export const handleInboundMessage = internalAction({
  args: {
    slackThreadTs: v.string(),
    text: v.string(),
    slackUserId: v.optional(v.string()),
  },
  handler: async (ctx, { slackThreadTs, text, slackUserId }) => {
    let authorName: string | undefined;
    if (slackUserId && process.env.SLACK_BOT_TOKEN) {
      try {
        // users.info is form-encoded, not JSON.
        const res = await fetch(
          `https://slack.com/api/users.info?user=${encodeURIComponent(slackUserId)}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            },
          }
        );
        const data = (await res.json()) as any;
        if (data.ok) {
          authorName =
            data.user?.profile?.display_name ||
            data.user?.real_name ||
            data.user?.name ||
            undefined;
        }
      } catch (err) {
        console.warn("Slack users.info lookup failed:", err);
      }
    }

    await ctx.runMutation(internal.support.receiveSlackReply, {
      slackThreadTs,
      text,
      authorName,
    });
  },
});
