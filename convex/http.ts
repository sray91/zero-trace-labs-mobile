import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/**
 * Clerk Webhook Handler
 * Handles user.created, user.updated, user.deleted events
 */
http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("CLERK_WEBHOOK_SECRET not configured");
            return new Response("Webhook secret not configured", { status: 500 });
        }

        // Get Svix headers for verification
        const svixId = request.headers.get("svix-id");
        const svixTimestamp = request.headers.get("svix-timestamp");
        const svixSignature = request.headers.get("svix-signature");

        if (!svixId || !svixTimestamp || !svixSignature) {
            return new Response("Missing Svix headers", { status: 400 });
        }

        const body = await request.text();

        // Verify webhook signature
        const wh = new Webhook(webhookSecret);
        let evt: any;

        try {
            evt = wh.verify(body, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            });
        } catch (err) {
            console.error("Webhook verification failed:", err);
            return new Response("Webhook verification failed", { status: 400 });
        }

        const eventType = evt.type;
        const userData = evt.data;

        switch (eventType) {
            case "user.created":
            case "user.updated":
                await ctx.runMutation(internal.users.upsertFromClerk, {
                    clerkId: userData.id,
                    email: userData.email_addresses?.[0]?.email_address,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    imageUrl: userData.image_url,
                });
                break;

            case "user.deleted":
                await ctx.runMutation(internal.users.deleteByClerkId, {
                    clerkId: userData.id,
                });
                break;

            default:
                console.log(`Unhandled Clerk event type: ${eventType}`);
        }

        return new Response("OK", { status: 200 });
    }),
});

/**
 * RevenueCat Webhook Handler
 * Handles subscription events from RevenueCat
 */
http.route({
    path: "/revenuecat-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

        // Verify authorization header if secret is configured
        if (webhookSecret) {
            const authHeader = request.headers.get("Authorization");
            if (authHeader !== `Bearer ${webhookSecret}`) {
                return new Response("Unauthorized", { status: 401 });
            }
        }

        const body = await request.json();
        const event = body.event;
        const appUserId = body.app_user_id; // This should be the Clerk user ID

        if (!appUserId) {
            console.error("No app_user_id in RevenueCat webhook");
            return new Response("Missing app_user_id", { status: 400 });
        }

        // Map RevenueCat event types to our subscription status
        const eventType = event?.type;
        let status: "none" | "active" | "trialing" | "past_due" | "cancelled" | "expired" = "none";
        let hasAppAccess = false;

        switch (eventType) {
            case "INITIAL_PURCHASE":
            case "RENEWAL":
            case "UNCANCELLATION":
                status = "active";
                hasAppAccess = true;
                break;
            case "PRODUCT_CHANGE":
                status = "active";
                hasAppAccess = true;
                break;
            case "CANCELLATION":
                status = "cancelled";
                // Still has access until period end
                hasAppAccess = event?.expiration_at_ms ? Date.now() < event.expiration_at_ms : false;
                break;
            case "BILLING_ISSUE":
                status = "past_due";
                hasAppAccess = true; // Usually still has access during billing issue grace period
                break;
            case "EXPIRATION":
                status = "expired";
                hasAppAccess = false;
                break;
            case "SUBSCRIBER_ALIAS":
                // User identity alias - no status change needed
                return new Response("OK", { status: 200 });
            default:
                console.log(`Unhandled RevenueCat event type: ${eventType}`);
                return new Response("OK", { status: 200 });
        }

        // Get entitlement info
        const entitlements = event?.entitlement_ids || [];
        const productId = event?.product_id;
        const subscriberId = event?.subscriber_id || body.original_app_user_id;
        const periodStart = event?.purchased_at_ms;
        const periodEnd = event?.expiration_at_ms;

        await ctx.runMutation(internal.subscriptions.upsertFromRevenueCat, {
            clerkId: appUserId,
            status,
            planId: productId,
            planName: entitlements[0] || productId,
            providerSubscriptionId: event?.transaction_id,
            providerCustomerId: subscriberId,
            hasAppAccess,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
        });

        return new Response("OK", { status: 200 });
    }),
});

export default http;
