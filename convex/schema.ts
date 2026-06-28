import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// NOTE: This schema is the single source of truth for the Convex deployment shared
// with the iOS app. `users` and `subscriptions` mirror what the iOS client expects;
// reconcile field names with the live deployment when you first run `npx convex dev`.
export default defineSchema({
  // Identity, populated/kept in sync by the Clerk webhook (see convex/http.ts).
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // Synced from Clerk publicMetadata.role by the Clerk webhook (convex/http.ts).
    // "admin" unlocks the admin console; absent/anything else = regular user.
    role: v.optional(v.string()),
    // Per-user proxy/alias address (e.g. u-ab12cd34@mail.0tracelabs.com) that the
    // admin types into broker opt-out forms. Broker verification emails sent here are
    // routed (Cloudflare Email Routing -> /inbound-email) into `inboxMessages`.
    // Generated on first sync (convex/users.ts) and backfilled for existing users.
    proxyEmail: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_proxy_email", ["proxyEmail"]),

  // Entitlement state, kept in sync by the RevenueCat webhook (see convex/http.ts).
  // `revenueCatAppUserId` equals the Clerk user id so iOS and web resolve to the
  // same entitlement.
  subscriptions: defineTable({
    userId: v.optional(v.id("users")),
    revenueCatAppUserId: v.string(),
    status: v.string(), // active | trialing | past_due | cancelled | expired
    isPaid: v.boolean(),
    plan: v.string(), // slug, e.g. "pro" or "free"
    planLabel: v.string(),
    provider: v.string(), // "revenuecat"
    entitlementId: v.optional(v.string()),
    productId: v.optional(v.string()),
    store: v.optional(v.string()), // app_store | play_store | stripe (web billing)
    currentPeriodEnd: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_rc_app_user_id", ["revenueCatAppUserId"]),

  // Web onboarding profile (mirrors the old Supabase user_profiles table).
  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    welcomeCompleted: v.boolean(),
    welcomeStep: v.optional(v.number()),
    privacyConsentGiven: v.optional(v.boolean()),
    privacyConsentDate: v.optional(v.number()),
    termsAccepted: v.optional(v.boolean()),
    termsAcceptedDate: v.optional(v.number()),
    tourCompleted: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  // The broker catalog. Static, shared across all users. Mirrors the spreadsheet's
  // "Master Tracker" static columns; per-user removal state lives in brokerExposures.
  dataSources: defineTable({
    name: v.string(),
    url: v.string(),
    apiEndpoint: v.optional(v.string()),
    riskLevel: v.string(), // low | medium | high
    description: v.optional(v.string()),
    dataTypes: v.array(v.string()),
    isActive: v.boolean(),
    // Master Tracker catalog fields (optional so the legacy 5-row seed still validates).
    tier: v.optional(v.number()), // 1 = Crucial, 2 = High, 3 = Standard
    category: v.optional(v.string()),
    searchUrl: v.optional(v.string()),
    optOutUrl: v.optional(v.string()),
    optOutMethod: v.optional(v.string()),
    difficulty: v.optional(v.string()), // Easy | Medium | Hard
    estProcessingDays: v.optional(v.number()),
    alsoCovers: v.optional(v.string()),
    parentCompany: v.optional(v.string()),
    instructions: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"])
    .index("by_tier", ["tier"]),

  // Per-user, per-broker working record. Combines the spreadsheet's "🎯 Master
  // Tracker" removal columns (status/dates/confirmation) and the "🔍 Search Log"
  // columns (searchedAt/searchTerm/whatWasFound/screenshotTaken/actionTaken/
  // followUpNeeded) into one row, since both tabs are keyed by user + broker.
  brokerExposures: defineTable({
    userId: v.id("users"),
    dataSourceId: v.id("dataSources"),
    exposureStatus: v.string(), // unchecked | found | not_found  (Search Log "Data Found?")
    // not_started | searched_not_found | searched_found | submitted | removed |
    // reappeared | handled_by_service | skipped (drives the user dashboard breakdown)
    removalStatus: v.string(),
    listingUrl: v.optional(v.string()), // Profile URL Found
    confirmationRef: v.optional(v.string()),
    checklist: v.optional(v.any()),
    foundAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    removedAt: v.optional(v.number()), // Date Verified
    verifiedRemoved: v.optional(v.boolean()), // Verified Removed? (Y/N)
    recheckAt: v.optional(v.number()), // Re-Check Due Date
    notes: v.optional(v.string()),
    // ---- Search Log columns ----
    searchedAt: v.optional(v.number()), // Date Searched
    searchTerm: v.optional(v.string()), // Search Term Used
    whatWasFound: v.optional(v.string()), // What Was Found
    screenshotTaken: v.optional(v.boolean()), // Screenshot Taken?
    actionTaken: v.optional(v.string()), // Action Taken
    followUpNeeded: v.optional(v.boolean()), // Follow-Up Needed?
  })
    .index("by_user", ["userId"])
    .index("by_user_and_source", ["userId", "dataSourceId"]),

  searchHistory: defineTable({
    userId: v.id("users"),
    fullName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    results: v.optional(v.any()),
  }).index("by_user", ["userId"]),

  removalRequests: defineTable({
    userId: v.id("users"),
    dataSourceId: v.optional(v.id("dataSources")),
    fullName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.string(), // pending | submitted | completed | failed
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Free-form to-do items an admin tracks per user (e.g. "call MyLife", "follow up
  // Radaris"). Separate from brokerExposures, which is the per-broker removal state.
  userTasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // open | in_progress | done
    priority: v.optional(v.string()), // low | medium | high
    dueDate: v.optional(v.number()),
    relatedDataSourceId: v.optional(v.id("dataSources")),
    createdByClerkId: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Inbound mail received at a user's proxyEmail. Written by the /inbound-email HTTP
  // endpoint (fed by Cloudflare Email Routing). Receive-only: the admin reads these
  // in the user detail page and clicks the broker verification links. No outbound.
  inboxMessages: defineTable({
    userId: v.id("users"),
    proxyEmail: v.string(), // the recipient alias it arrived at
    fromAddress: v.string(),
    subject: v.optional(v.string()),
    text: v.optional(v.string()),
    html: v.optional(v.string()),
    receivedAt: v.number(),
    isRead: v.boolean(),
    // http(s) links pulled from the body, verification-looking ones first.
    extractedLinks: v.array(v.string()),
    // Best-effort broker match by sender domain, for tagging in the UI.
    dataSourceId: v.optional(v.id("dataSources")),
  })
    .index("by_user", ["userId"])
    .index("by_proxy_email", ["proxyEmail"]),
});
