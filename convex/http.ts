import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// ---- Clerk webhook: keeps the `users` table in sync ----
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret) {
      return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", { status: 500 });
    }

    const payload = await request.text();
    const headers = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };

    let event: any;
    try {
      event = new Webhook(secret).verify(payload, headers);
    } catch (err) {
      console.error("Clerk webhook verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    const type = event.type as string;
    const data = event.data;

    if (type === "user.created" || type === "user.updated") {
      const email = data.email_addresses?.find(
        (e: any) => e.id === data.primary_email_address_id
      )?.email_address ?? data.email_addresses?.[0]?.email_address;
      const name =
        [data.first_name, data.last_name].filter(Boolean).join(" ") || undefined;

      const role =
        typeof data.public_metadata?.role === "string"
          ? data.public_metadata.role
          : undefined;

      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: data.id,
        email,
        name,
        imageUrl: data.image_url ?? undefined,
        role,
      });
    } else if (type === "user.deleted") {
      if (data.id) {
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkId: data.id,
        });
      }
    }

    return new Response(null, { status: 200 });
  }),
});

// ---- RevenueCat webhook: keeps the `subscriptions` table in sync ----
const slugify = (value?: string) =>
  (value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function statusForEvent(type: string): string {
  switch (type) {
    case "EXPIRATION":
    case "SUBSCRIPTION_PAUSED":
      return "expired";
    case "BILLING_ISSUE":
      return "past_due";
    // CANCELLATION = auto-renew off but access remains until EXPIRATION fires.
    case "CANCELLATION":
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "NON_RENEWING_PURCHASE":
    default:
      return "active";
  }
}

http.route({
  path: "/revenuecat-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expected = process.env.REVENUECAT_WEBHOOK_AUTH_HEADER;
    if (expected && request.headers.get("Authorization") !== expected) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const event = body?.event;
    if (!event?.app_user_id) {
      return new Response("Ignored", { status: 200 });
    }

    const productId: string | undefined = event.product_id;
    const entitlementId: string | undefined =
      event.entitlement_ids?.[0] ?? event.entitlement_id ?? undefined;
    const plan = slugify(entitlementId || productId) || "pro";
    const planLabel = entitlementId || productId || "Pro Plan";

    await ctx.runMutation(internal.subscriptions.upsertFromRevenueCat, {
      revenueCatAppUserId: event.app_user_id,
      status: statusForEvent(event.type),
      plan,
      planLabel,
      entitlementId,
      productId,
      store: event.store,
      currentPeriodEnd: event.expiration_at_ms ?? undefined,
    });

    return new Response(null, { status: 200 });
  }),
});

export default http;
