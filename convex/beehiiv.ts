import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Adds every app signup to the beehiiv newsletter. Scheduled from
// users.upsertFromClerk whenever a user has an email but no `beehiivSubscribedAt`,
// so a failed attempt is retried on the user's next Clerk update (or by `backfill`).
//
// Convex env vars required:
//   BEEHIIV_API_KEY         beehiiv API key
//   BEEHIIV_PUBLICATION_ID  pub_... id of the ZeroTraceLabs publication
// If they're unset the sync is skipped so signups still work.

export const addSubscriber = internalAction({
  args: { userId: v.id("users"), email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, { userId, email, name }) => {
    const apiKey = process.env.BEEHIIV_API_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
    if (!apiKey || !publicationId) {
      console.warn("beehiiv not configured (BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID); skipping");
      return;
    }

    const [firstName, ...rest] = (name ?? "").trim().split(/\s+/);
    const customFields = [
      firstName && { name: "first_name", value: firstName },
      rest.length > 0 && { name: "last_name", value: rest.join(" ") },
    ].filter(Boolean);

    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: "ios-app",
          utm_medium: "app",
          utm_campaign: "app-signup",
          custom_fields: customFields,
        }),
      }
    );
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      throw new Error(
        `beehiiv subscribe failed for ${email} (${res.status}): ${
          data.errors?.[0]?.message ?? data.message ?? res.statusText
        }`
      );
    }

    await ctx.runMutation(internal.beehiiv.markSubscribed, {
      userId,
      subscriberId: data.data?.id,
    });
  },
});

export const markSubscribed = internalMutation({
  args: { userId: v.id("users"), subscriberId: v.optional(v.string()) },
  handler: async (ctx, { userId, subscriberId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;
    await ctx.db.patch(userId, {
      beehiivSubscribedAt: Date.now(),
      beehiivSubscriberId: subscriberId,
    });
  },
});

// One-off / re-runnable: queue every user with an email who isn't in beehiiv yet.
// Run with: npx convex run beehiiv:backfill --prod
export const backfill = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let queued = 0;
    for (const user of users) {
      if (!user.email || user.beehiivSubscribedAt) continue;
      // Stagger requests to stay well under beehiiv's rate limit.
      await ctx.scheduler.runAfter(queued * 500, internal.beehiiv.addSubscriber, {
        userId: user._id,
        email: user.email,
        name: user.name,
      });
      queued++;
    }
    return { queued };
  },
});
