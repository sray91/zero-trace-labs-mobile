import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Emails the team when a new user is created from Clerk. Scheduled from the insert
// branch of users.upsertFromClerk, so Clerk webhook retries don't send duplicates.
// Sent through the zerotrace-send-email Cloudflare Worker (Email Routing send_email).
//
// Convex env vars required:
//   EMAIL_WORKER_URL        https://zerotrace-send-email.<subdomain>.workers.dev
//   EMAIL_WORKER_SECRET     must match SEND_EMAIL_SECRET on the worker
//   NEW_USER_ALERT_EMAIL    recipient; comma-separate for several
// If they're unset the alert is skipped so signups still work.

export const sendNewUserAlert = internalAction({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (_ctx, { clerkId, email, name }) => {
    const url = process.env.EMAIL_WORKER_URL;
    const secret = process.env.EMAIL_WORKER_SECRET;
    const recipients = (process.env.NEW_USER_ALERT_EMAIL ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!url || !secret || recipients.length === 0) {
      console.warn("New-user alert not configured (EMAIL_WORKER_URL / EMAIL_WORKER_SECRET / NEW_USER_ALERT_EMAIL); skipping");
      return;
    }

    const who = name ? `${name} (${email ?? "no email"})` : email ?? clerkId;
    const text = [
      "A new user just signed up for 0 Trace Labs.",
      "",
      `Name:     ${name ?? "—"}`,
      `Email:    ${email ?? "—"}`,
      `Clerk ID: ${clerkId}`,
      `Time:     ${new Date().toISOString()}`,
    ].join("\n");

    for (const to of recipients) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-send-secret": secret },
        body: JSON.stringify({ to, subject: `New signup: ${who}`, text }),
      });
      if (!res.ok) {
        throw new Error(`New-user alert to ${to} failed (${res.status}): ${await res.text()}`);
      }
    }
  },
});
