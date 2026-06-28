import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Resolve the Convex user document for the authenticated Clerk identity.
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

// Same as getCurrentUser but throws — use inside queries/read paths that require auth.
export async function requireCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

// Throws unless the authenticated user is an admin. The `role` is synced from Clerk
// publicMetadata.role by the webhook (convex/http.ts). Use to guard admin functions.
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await requireCurrentUser(ctx);
  if (user.role !== "admin") throw new Error("Not authorized");
  return user;
}

// For mutations: resolve the user row for the authenticated Clerk identity, creating
// it on first write if the Clerk webhook hasn't synced it yet. This avoids a race on
// fresh sign-ups where the user reaches /welcome before `user.created` is delivered.
export async function getOrCreateCurrentUser(
  ctx: MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (existing) return existing;

  const userId = await ctx.db.insert("users", {
    clerkId: identity.subject,
    email: identity.email,
    name: identity.name,
    imageUrl: identity.pictureUrl,
  });

  // Link any subscription that arrived (via RevenueCat) before the user existed.
  const orphanSub = await ctx.db
    .query("subscriptions")
    .withIndex("by_rc_app_user_id", (q) =>
      q.eq("revenueCatAppUserId", identity.subject)
    )
    .unique();
  if (orphanSub && !orphanSub.userId) {
    await ctx.db.patch(orphanSub._id, { userId });
  }

  return (await ctx.db.get(userId))!;
}

export const current = query({
  args: {},
  handler: async (ctx) => getCurrentUser(ctx),
});

// Server-truth admin check for layout guards (client also gates instantly via Clerk
// publicMetadata, but Convex mutations enforce this regardless).
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return user?.role === "admin";
  },
});

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return profile;
  },
});

export const upsertProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    welcomeCompleted: v.optional(v.boolean()),
    welcomeStep: v.optional(v.number()),
    privacyConsentGiven: v.optional(v.boolean()),
    termsAccepted: v.optional(v.boolean()),
    tourCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateCurrentUser(ctx);
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();
    const patch: Record<string, unknown> = { ...args };
    if (args.privacyConsentGiven) patch.privacyConsentDate = now;
    if (args.termsAccepted) patch.termsAcceptedDate = now;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("userProfiles", {
      userId: user._id,
      welcomeCompleted: false,
      ...patch,
    });
  },
});

// Called by the Clerk webhook (convex/http.ts) on user.created / user.updated.
// Non-guessable per-user proxy address. The domain comes from PROXY_EMAIL_DOMAIN on
// the Convex deployment (set it to your Cloudflare Email Routing domain).
const PROXY_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
export function makeProxyEmail(): string {
  const domain = process.env.PROXY_EMAIL_DOMAIN || "mail.0tracelabs.com";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => PROXY_ALPHABET[b % 36]).join("");
  return `u-${token}@${domain}`;
}

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        role: args.role,
        // Backfill the proxy address for users created before this feature.
        proxyEmail: existing.proxyEmail ?? makeProxyEmail(),
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      role: args.role,
      proxyEmail: makeProxyEmail(),
    });

    // Link any subscription that arrived (via RevenueCat) before the user existed.
    const orphanSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_rc_app_user_id", (q) =>
        q.eq("revenueCatAppUserId", args.clerkId)
      )
      .unique();
    if (orphanSub && !orphanSub.userId) {
      await ctx.db.patch(orphanSub._id, { userId });
    }

    return userId;
  },
});

// Called by the Clerk webhook on user.deleted.
export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (profile) await ctx.db.delete(profile._id);

    await ctx.db.delete(user._id);
  },
});

// Ensure a single user has a proxy address. Admin-only; called lazily from the user
// detail page so existing users get one without waiting for the next Clerk sync.
export const ensureProxyEmail = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.proxyEmail) return user.proxyEmail;
    const proxyEmail = makeProxyEmail();
    await ctx.db.patch(userId, { proxyEmail });
    return proxyEmail;
  },
});

// One-shot backfill for every user missing a proxy address. Internal so it can be run
// from the CLI without an authenticated admin:
//   npx convex run users:backfillProxyEmails
export const backfillProxyEmails = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let updated = 0;
    for (const u of users) {
      if (!u.proxyEmail) {
        await ctx.db.patch(u._id, { proxyEmail: makeProxyEmail() });
        updated++;
      }
    }
    return { updated };
  },
});
