import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// Pull http(s) links out of a message body, de-duplicated, with verification-looking
// links floated to the top so the admin sees the actionable one first.
const URL_RE = /https?:\/\/[^\s"'<>)\]}]+/gi;
const VERIFY_HINT = /(verif|confirm|opt[-_]?out|remov|unsubscrib|validate|activate)/i;

function extractLinks(text?: string, html?: string): string[] {
  const found = new Set<string>();
  for (const src of [text, html]) {
    if (!src) continue;
    for (const m of src.matchAll(URL_RE)) {
      // Trim trailing punctuation that commonly clings to URLs in plain text.
      found.add(m[0].replace(/[.,;:'")\]}>]+$/, ""));
    }
  }
  return Array.from(found)
    .sort((a, b) => Number(VERIFY_HINT.test(b)) - Number(VERIFY_HINT.test(a)))
    .slice(0, 30);
}

function domainOf(address: string): string | null {
  const at = address.lastIndexOf("@");
  if (at === -1) return null;
  const host = address
    .slice(at + 1)
    .trim()
    .toLowerCase()
    .replace(/[>)\s].*$/, "");
  return host || null;
}

// Inserted by the /inbound-email HTTP endpoint (Cloudflare Email Routing -> http.ts).
// Looks up the user by recipient alias and stores the message; drops mail addressed
// to an unknown alias.
export const receiveInbound = internalMutation({
  args: {
    to: v.string(),
    from: v.string(),
    subject: v.optional(v.string()),
    text: v.optional(v.string()),
    html: v.optional(v.string()),
    receivedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const proxyEmail = args.to.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_proxy_email", (q) => q.eq("proxyEmail", proxyEmail))
      .unique();
    if (!user) {
      console.warn("Inbound email to unknown alias:", proxyEmail);
      return { stored: false };
    }

    // Best-effort: tag the message with a broker whose URL matches the sender domain.
    let dataSourceId: Id<"dataSources"> | undefined;
    const senderDomain = domainOf(args.from);
    if (senderDomain) {
      const brokers = await ctx.db.query("dataSources").collect();
      const match = brokers.find((b) => {
        const host = domainOf(`x@${(b.url || "").replace(/^https?:\/\//, "")}`);
        return (
          host &&
          (host === senderDomain ||
            host.endsWith(`.${senderDomain}`) ||
            senderDomain.endsWith(`.${host}`))
        );
      });
      dataSourceId = match?._id;
    }

    await ctx.db.insert("inboxMessages", {
      userId: user._id,
      proxyEmail,
      fromAddress: args.from,
      subject: args.subject,
      text: args.text,
      html: args.html,
      receivedAt: args.receivedAt ?? Date.now(),
      isRead: false,
      extractedLinks: extractLinks(args.text, args.html),
      dataSourceId,
    });
    return { stored: true };
  },
});

// Messages for one user, newest first. Admin only.
export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    const messages = await ctx.db
      .query("inboxMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    messages.sort((a, b) => b.receivedAt - a.receivedAt);
    return messages;
  },
});

export const markRead = mutation({
  args: { messageId: v.id("inboxMessages"), isRead: v.boolean() },
  handler: async (ctx, { messageId, isRead }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(messageId, { isRead });
  },
});
