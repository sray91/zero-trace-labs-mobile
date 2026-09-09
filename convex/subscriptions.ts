import { v } from "convex/values";
import {
  internalMutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentUser, requireCurrentUser } from "./users";

const FREE = { plan: "free", planLabel: "Free Plan", isPaid: false } as const;

// Returns the current user's entitlement, replacing the old Whop /api/whop/plan route.
export const getEntitlement = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { ...FREE };

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!sub || !sub.isPaid) return { ...FREE };

    return {
      plan: sub.plan || "paid",
      planLabel: sub.planLabel || "Paid Plan",
      isPaid: true,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd ?? null,
    };
  },
});

// ---- Server-side entitlement enforcement ----
//
// `components/auth/subscription-gate.tsx` only controls *navigation*. Anything calling
// these Convex functions directly — a script, a rebuilt client, curl with a session
// token — bypasses it completely. The checks below are the real boundary.
//
// Gated behind ENFORCE_SUBSCRIPTIONS because billing is not live yet: until the
// RevenueCat dashboard setup is finished nobody has a paid `subscriptions` row, so
// enforcing today would lock out every existing user. Flip this on at launch:
//
//   npx convex env set ENFORCE_SUBSCRIPTIONS true --prod
//
// Admins always bypass, so support staff keep access regardless.
const enforcementEnabled = () => process.env.ENFORCE_SUBSCRIPTIONS === "true";

async function hasPaidAccess(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">
): Promise<boolean> {
  if (!enforcementEnabled()) return true;
  if (user.role === "admin") return true;

  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();

  return sub?.isPaid === true;
}

/**
 * For read paths that already degrade gracefully on a missing user: returns null for
 * signed-out *and* unpaid callers, so queries keep returning their empty shape instead
 * of surfacing an error in the UI.
 */
export async function getPaidUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const user = await getCurrentUser(ctx);
  if (!user) return null;
  return (await hasPaidAccess(ctx, user)) ? user : null;
}

/** For write paths: throws unless the caller has an active plan. */
export async function requirePaidUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await requireCurrentUser(ctx);
  if (!(await hasPaidAccess(ctx, user))) {
    throw new Error("Subscription required");
  }
  return user;
}

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

// Called by the RevenueCat webhook (convex/http.ts). Keyed by app_user_id == Clerk id.
export const upsertFromRevenueCat = internalMutation({
  args: {
    revenueCatAppUserId: v.string(),
    status: v.string(),
    plan: v.string(),
    planLabel: v.string(),
    entitlementId: v.optional(v.string()),
    productId: v.optional(v.string()),
    store: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const isPaid = ACTIVE_STATUSES.has(args.status.toLowerCase());

    // app_user_id is the Clerk id; link to the Convex user if it exists yet.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.revenueCatAppUserId)
      )
      .unique();

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_rc_app_user_id", (q) =>
        q.eq("revenueCatAppUserId", args.revenueCatAppUserId)
      )
      .unique();

    const doc = {
      userId: user?._id,
      revenueCatAppUserId: args.revenueCatAppUserId,
      status: args.status,
      isPaid,
      plan: isPaid ? args.plan : "free",
      planLabel: isPaid ? args.planLabel : "Free Plan",
      provider: "revenuecat",
      entitlementId: args.entitlementId,
      productId: args.productId,
      store: args.store,
      currentPeriodEnd: args.currentPeriodEnd,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("subscriptions", doc);
  },
});
