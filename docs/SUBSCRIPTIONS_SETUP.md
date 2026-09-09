# Subscriptions Setup — Billing, App Store Connect, RevenueCat

**This is the current, authoritative payments doc.** Everything else in `docs/` that
mentions payments (`SETUP_PAYMENTS.md`, `NEXT_STEPS.md`, `PAYMENT_INTEGRATION.md`,
`IMPLEMENTATION_COMPLETE.md`, `PRICING_TIERS.md`, `SUPABASE_SETUP.md`) describes the old
Superwall + Whop + Supabase stack replaced during the Clerk/Convex migration. Those are
marked outdated at the top of each file — ignore them.

## Contents

1. [Billing solution — what we use and why](#1-billing-solution--what-we-use-and-why)
2. [Plans and pricing](#2-plans-and-pricing)
3. [Architecture](#3-architecture)
4. [What's already built in this repo](#4-whats-already-built-in-this-repo)
5. [App Store Connect](#5-app-store-connect)
6. [Google Play Console](#6-google-play-console)
7. [RevenueCat dashboard](#7-revenuecat-dashboard)
8. [Wire the keys](#8-wire-the-keys)
9. [Webhook](#9-webhook)
10. [Build and test](#10-build-and-test)
11. [Troubleshooting](#11-troubleshooting)
12. [Web billing, later](#12-web-billing-later)
13. [Reference values](#13-reference-values)

---

## 1. Billing solution — what we use and why

**RevenueCat**, on top of StoreKit (iOS) and Play Billing (Android).

The key constraint: for digital subscriptions like ours, **the app stores are the payment
processor on mobile, and that is not optional.** Apple and Google take the money and their
cut. No vendor choice changes that. So "a mobile billing solution" means a layer that
manages receipt validation, entitlements, and subscription state on top of the stores.

Why RevenueCat over the alternatives:

| Option | Verdict |
| --- | --- |
| **RevenueCat** | ✅ What we use. Receipt validation, cross-platform entitlements, webhooks, hosted paywalls, analytics. |
| Direct StoreKit / Play Billing (`expo-iap`) | No vendor fee, but you own receipt validation, renewal tracking, grace periods, refunds, and cross-platform sync. Real subsystem, nasty failure mode — bugs silently grant or revoke access. Worth it only at large scale. |
| Adapty | Genuinely comparable. No reason to switch; switching costs the integration already built. |
| Superwall | A paywall/experimentation layer, **not** a billing backend. Runs *on top of* RevenueCat. Consider later for paywall A/B testing. |
| Stripe / Paddle / Whop | Web only. Cannot process an in-app purchase on iOS. Relevant only for a future web checkout — see §12. |

**Cost:** free below roughly $2.5K/month tracked revenue (~165 subscribers at $14.99),
then about 1% of tracked revenue. Verify current numbers on RevenueCat's pricing page.
For scale, Apple takes 15% (Small Business Program, under $1M/yr) or 30% — RevenueCat's
cut is noise next to the store's.

---

## 2. Plans and pricing

| Plan    | Price        | Notes                                         |
| ------- | ------------ | --------------------------------------------- |
| Monthly | $14.99 / mo  |                                               |
| Annual  | $149.99 / yr | $179.88 billed monthly → saves $29.89 (16.6%) |

Both are standard Apple/Google price points, so they exist in every storefront.

The savings claim in the UI is **"Save 16%"** — deliberately rounded *down* from 16.6%,
since App Review holds you to any savings figure you display. Don't round up to 17%, and
note "2 months free" would slightly overstate it ($29.89 saved vs $29.98 for two months).

These figures are hardcoded in only two places, both fallback copy — the live paywall
pulls localized prices from RevenueCat:

- `app/paywall.tsx` — the price block shown when the RevenueCat offering can't load
- `app/(tabs)/settings.tsx` — the "subscribe for…" line on the free-plan card

---

## 3. Architecture

```
User taps subscribe
  → RevenueCat hosted paywall (built in the RC dashboard, rendered by react-native-purchases-ui)
  → Apple / Google processes payment
  → RevenueCat webhook → https://standing-swordfish-884.convex.site/revenuecat-webhook
  → convex/subscriptions.ts:upsertFromRevenueCat writes the `subscriptions` row
  → app reads it reactively via api.subscriptions.getEntitlement
```

Access is granted if **either** source says paid:

1. **RevenueCat, device-local** — instant, no webhook round-trip.
2. **Convex `getEntitlement`** — the durable server record; the only source that survives
   a reinstall or works on another device.

**Identity is the critical wire.** The SDK is configured with the **Clerk user id** as
`appUserID` (`components/providers/revenue-cat-provider.tsx`). RevenueCat echoes it back
as `event.app_user_id`, and `convex/subscriptions.ts` resolves the account by matching it
against `users.clerkId`. Configure the SDK anonymously and purchases succeed but never
attach to an account.

---

## 4. What's already built in this repo

| Piece | Location |
| ----- | -------- |
| `subscriptions` table | `convex/schema.ts` |
| Entitlement query + webhook mutation | `convex/subscriptions.ts` |
| Webhook route | `convex/http.ts` (`/revenuecat-webhook`) |
| SDK wrapper | `lib/revenue-cat.ts` |
| Local entitlement state | `lib/stores/subscription-store.ts` |
| SDK config + Clerk identity + renewal listener | `components/providers/revenue-cat-provider.tsx` |
| Access gate | `components/auth/subscription-gate.tsx` |
| Paywall screen (+ fallback, restore, sign out) | `app/paywall.tsx` |
| Plan status / manage / restore | `app/(tabs)/settings.tsx` |

**Fail-open behavior:** if the RevenueCat API keys are missing (or on Expo web, where
there's no StoreKit/Play Billing), `SubscriptionGate` does **not** block anyone. That's
deliberate — otherwise a build shipped before dashboard setup finishes would lock every
user out. The gate activates automatically once real keys are in the build.

Everything below is dashboard and store configuration. No further code changes are needed.

---

## 5. App Store Connect

### 5.0 Agreements first — before anything else

**App Store Connect → Business** (older UI: "Agreements, Tax, and Banking"):

- [ ] **Paid Applications** agreement status is **Active**
- [ ] Bank account added and verified
- [ ] Tax forms completed for the US and any other regions you sell in

> 🔴 If this is not Active, everything below will look correctly configured and your
> paywall will still return **zero products**, in sandbox and production alike. There is
> no error message. This is the single most common cause of "the paywall is blank," and
> bank verification can take days. Check it first.

### 5.1 Create the subscription group

App (**0Trace Labs**, Apple ID `6758482991`) → **Monetization → Subscriptions** → create a
group.

- Reference Name: `0Trace Labs Premium` (internal only)
- Localized Display Name: `0Trace Labs Premium` — user-visible, shown in iOS Settings →
  Subscriptions

Both plans must live in **the same group**. That's what makes monthly ↔ annual a
switch rather than two stacked active subscriptions.

### 5.2 Create the two subscriptions

**Monthly**

| Field | Value |
| --- | --- |
| Reference Name | `Premium Monthly` |
| Product ID | `com.zerotracelabs.app.premium.monthly` |
| Duration | 1 Month |
| Price | $14.99 USD |

**Annual**

| Field | Value |
| --- | --- |
| Reference Name | `Premium Annual` |
| Product ID | `com.zerotracelabs.app.premium.annual` |
| Duration | 1 Year |
| Price | $149.99 USD |

> ⚠️ **Product IDs are permanent.** They cannot be renamed, reused, or deleted once
> created — a typo burns that string forever. Copy-paste them.

Set the **subscription level** within the group (annual ranked above monthly) so a
monthly→annual move is treated as an upgrade.

### 5.3 Required metadata

Each subscription sits in **"Missing Metadata"** and can't be submitted until it has:

- [ ] **Localization** — display name + description, at minimum English (U.S.)
- [ ] **Review screenshot** — required per subscription. Chicken-and-egg: you need a build
      with a working paywall to screenshot, so capture these from the dev build in §10.
- [ ] **Review notes** — state plainly what it unlocks (continuous data-broker removals,
      monthly re-scans, dark web monitoring). Vague notes get rejected.
- [ ] **Tax category** — choose the one matching a software service
- [ ] **Availability** — countries/regions

Recommended at group level: enable **Billing Grace Period**, so a failed payment doesn't
instantly revoke access. That maps to the `past_due` status the webhook already treats as
still-paid (`convex/subscriptions.ts:31`).

Skip introductory offers / free trials unless you want them — adding one changes the
paywall copy and the review notes.

### 5.4 In-App Purchase Key (RevenueCat needs this)

**Users and Access → Integrations → In-App Purchase** → generate a key.

- [ ] Download the `.p8` — **you get exactly one download**, there is no second chance
- [ ] Note the Key ID and your Issuer ID

### 5.5 Sandbox tester

**Users and Access → Sandbox → Test Accounts** → add one.

Use an email that has **never** been an Apple ID. A plus-alias on a domain you control
works (`you+sbx1@yourdomain.com`). Don't sign into the App Store with it — on device, sign
in only when the purchase sheet prompts, or via Settings → App Store → Sandbox Account.

### 5.6 Submitting for review

Your **first** subscription generally must be submitted alongside an app version binary;
Apple won't approve IAPs for an app that has never shipped them. Later ones can usually go
independently. Simplest path: attach both subscriptions to your next build submission.

> You do **not** need approval to test. Subscriptions in "Ready to Submit" / "Waiting for
> Review" work in sandbox, so the full purchase → webhook → Convex flow can be validated
> before review.

> Products take time to propagate — anywhere from ~15 minutes to several hours after
> creation before they're fetchable in sandbox. A null `getOfferings()` immediately after
> creating them is usually just propagation, not a bug.

---

## 6. Google Play Console

- [ ] Upload a build to a track (internal testing is fine) **first** — Play won't let you
      create subscriptions until an APK/AAB containing the billing library exists.
      Package: `com.zerotrace.labs`
- [ ] Create a subscription `premium` with two base plans: `monthly` ($14.99) and
      `annual` ($149.99)
- [ ] Create a **service account** with Play Developer API access; download the JSON for
      RevenueCat
- [ ] Add **license testers** (Setup → License testing) so test purchases don't charge

---

## 7. RevenueCat dashboard

> **Prerequisite:** the store products must already exist (§5, §6). RevenueCat imports
> products; it does not create them.

Exact menu labels drift between dashboard revisions — match on intent if a name differs.

### 7.1 Project and platform apps

Create the project, then add two apps under **Project settings → Apps**:

**iOS**
- [ ] Bundle ID: `com.zerotracelabs.app`
- [ ] Upload the In-App Purchase Key `.p8` from §5.4
- [ ] Optionally add the App Store Connect shared secret (some legacy flows use it)

**Android**
- [ ] Package: `com.zerotrace.labs`
- [ ] Upload the service account JSON from §6

> ⚠️ The identifiers genuinely differ per platform — iOS `com.zerotracelabs.app`, Android
> `com.zerotrace.labs`. That's not a typo, it's how the app is configured. Swapping them
> is a silent failure: the SDK connects fine and returns zero products.

### 7.2 Products

Under **Products**, import from each store. You should end up with four:

| Store | Product ID |
| --- | --- |
| App Store | `com.zerotracelabs.app.premium.monthly` |
| App Store | `com.zerotracelabs.app.premium.annual` |
| Play | `premium:monthly` (subscription `premium`, base plan `monthly`) |
| Play | `premium:annual` (subscription `premium`, base plan `annual`) |

Nothing to import usually means the products aren't live in the store yet, or the
credentials in §7.1 are wrong.

### 7.3 Entitlement — must match exactly

Create **one** entitlement:

- [ ] Identifier: **`premium`** — lowercase, exactly this
- [ ] Attach **all four** products to it

This is the only string the app checks. It's `PREMIUM_ENTITLEMENT_ID` in
`lib/revenue-cat.ts`. Rename it in the dashboard and you must rename it there too. The app
never inspects product IDs — any plan grants the same `premium` entitlement.

### 7.4 Offering and packages

- [ ] Create an offering (identifier `default` is fine) with two packages:
  - `$rc_monthly` → the two monthly products
  - `$rc_annual` → the two annual products
- [ ] **Mark the offering current**

Easy to miss, and it's what `getOfferings()` reads — `app/paywall.tsx` calls it on mount
and falls back to its own screen if it returns null.

### 7.5 Paywall

- [ ] Under **Paywalls**, build one against that offering and publish it

Not optional. `RevenueCatUI.Paywall` renders whatever you design here — layout, copy, and
pricing all come from the dashboard, not this repo. With no paywall configured it renders
blank. The `$14.99` / `$149.99` / "Save 16%" text in `app/paywall.tsx` is *only* the
offering-unavailable fallback, so put your real copy in the editor.

### 7.6 API keys

- [ ] **Project settings → API keys** → copy the two **public SDK keys** (`appl_…`,
      `goog_…`)

Public SDK keys only. The secret key must never go in `eas.json` — that file ships in the
bundle.

---

## 8. Wire the keys

The keys live in **EAS environment variables**, not in `eas.json`. All three build
profiles set `"environment": "production"`, so they all read from the `production`
environment — set each var once there:

```bash
eas env:create production --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY \
  --value appl_… --visibility sensitive --scope project --force
```

Repeat with `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` / `goog_…` when Android ships.

Check what's currently set with:

```bash
eas env:list production --include-sensitive
```

> ⚠️ Do **not** add these back to the `env` block in `eas.json`. Inline values there
> **override** the EAS-stored variables, so a stale entry silently shadows the real key —
> which is exactly how the `appl_REPLACE_ME` placeholders masked a correctly-configured
> key. `eas.json` intentionally only carries `EXPO_PUBLIC_CONVEX_URL` and
> `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` now.

Public SDK keys only — `EXPO_PUBLIC_*` values are inlined into the JS bundle, so the
RevenueCat *secret* key must never be set this way.

For local dev, put the same vars in `.env.local` (gitignored).

---

## 9. Webhook

RevenueCat → **Integrations → Webhooks**:

- URL: `https://standing-swordfish-884.convex.site/revenuecat-webhook`
- Authorization header: a long random secret

> Note **`.site`**, not the `.cloud` used for the Convex client URL. Different domains;
> `.cloud` will just fail.

Set the identical value in Convex:

```bash
npx convex env set REVENUECAT_WEBHOOK_AUTH_HEADER "<same secret>" --prod
```

✅ Already set on `standing-swordfish-884` (prod). The value is in the Convex dashboard
under Settings → Environment Variables — paste that exact string, including the
`Bearer ` prefix, into RevenueCat's Authorization header field.

The endpoint now **fails closed**: with the var unset it returns `503` and logs an error,
rather than accepting unauthenticated events. If webhooks start 503ing after a deployment,
the var is missing on that deployment.

---

### 9.1 Server-side enforcement — flip at launch

`SubscriptionGate` only controls navigation on the client. The Convex functions behind the
paid features (`dashboard.forCurrentUser`, `brokerExposures.*`, `removalRequests.*`) call
`getPaidUser` / `requirePaidUser` from `convex/subscriptions.ts`, which is the real
boundary against direct API calls.

It is **off by default** — with no products live nobody has a paid `subscriptions` row, so
enforcing early would lock out every existing user. Turn it on once purchases work
end-to-end:

```bash
npx convex env set ENFORCE_SUBSCRIPTIONS true --prod
```

Admins (`users.role === "admin"`) always bypass, so support keeps access. Unpaid reads
degrade to empty results rather than errors; unpaid writes throw `Subscription required`.

---

## 10. Build and test

`react-native-purchases` is native code — it does **not** run in Expo Go. You need a dev
build:

```bash
eas build --profile development --platform ios     # or android
```

Test matrix:

- [ ] Fresh sandbox account → gate redirects to `/paywall`
- [ ] Purchase monthly → returns to dashboard immediately (RevenueCat local entitlement)
- [ ] Convex `subscriptions` row exists with a populated `userId` — proves the Clerk id ↔
      `app_user_id` link works
- [ ] Delete + reinstall → **Restore Purchases** in Settings regrants access
- [ ] Cancel in sandbox → after expiry, the gate blocks again
- [ ] Settings shows the correct plan label and renewal date

> ⚠️ **A broken webhook will not show up in normal testing.** After a purchase, the app
> grants access from RevenueCat's local entitlement even if the webhook never fires. You
> can only catch it by checking the Convex table. Left undetected, it surfaces later as
> users losing access after a reinstall. Always verify the row.

---

## 11. Troubleshooting

**Paywall is blank / no packages** — almost always the Paid Apps agreement or missing
banking info (§5.0); otherwise no current Offering, products not attached to the
entitlement, or products still propagating.

**Purchase works but the app still gates the user** — check the Convex `subscriptions`
row:

| Symptom | Cause |
| --- | --- |
| Row exists, `userId` populated | Everything's wired — look elsewhere |
| Row exists, `userId` empty | Clerk user didn't resolve; check `revenueCatAppUserId` looks like `user_…` |
| No row at all | Webhook isn't landing — check the `.site` URL and that the Authorization header matches |

**Everyone gets in for free** — RevenueCat keys missing from the build, so the gate is
failing open by design (§4). Check `eas.json`.

**Products won't import into RevenueCat** — not live in the store yet, or the `.p8` /
service account JSON is wrong.

---

## 12. Web billing, later

If you later sell subscriptions on `app.0tracelabs.com`, use **RevenueCat Web Billing or
the Stripe integration** — both are natively supported and feed the same `premium`
entitlement with zero glue code.

**Do not reach for Whop.** RevenueCat has no Whop integration and won't; Whop is a web
checkout platform that cannot process an in-app purchase on iOS. That's exactly why the
old Superwall → Whop → webhook → Supabase chain existed and why it was removed.

If you ever *do* need to honor Whop purchases (e.g. pre-existing web customers), unify in
Convex rather than RevenueCat: add a Whop webhook route writing rows with
`provider: "whop"`. Note this requires a fix first — `convex/subscriptions.ts:17` uses
`.unique()` on the `by_user` index, which **throws** when a user has more than one
subscription row. A user with both a Whop and an App Store subscription would break
`getEntitlement` and fail closed. You'd need `.collect()` plus precedence logic (any paid
row wins).

**Policy note:** honoring a subscription bought on the web (user signs in on iOS, gets
access) is allowed. *Selling* it inside the iOS app through a non-IAP flow is not.
Linking out to a web checkout is actively litigated territory — the US rules loosened
after the 2025 Epic contempt ruling, other storefronts still require Apple's
external-purchase-link entitlement. Verify current guidelines before building any link-out.

---

## 13. Reference values

| Thing | Value |
| --- | --- |
| iOS bundle ID | `com.zerotracelabs.app` |
| Android package | `com.zerotrace.labs` |
| App Store Connect app ID | `6758482991` |
| Entitlement identifier | `premium` |
| iOS monthly product | `com.zerotracelabs.app.premium.monthly` |
| iOS annual product | `com.zerotracelabs.app.premium.annual` |
| Play subscription | `premium` (base plans `monthly`, `annual`) |
| Offering packages | `$rc_monthly`, `$rc_annual` |
| Webhook URL | `https://standing-swordfish-884.convex.site/revenuecat-webhook` |
| Convex env var | `REVENUECAT_WEBHOOK_AUTH_HEADER` |
| EAS env vars | `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` |
