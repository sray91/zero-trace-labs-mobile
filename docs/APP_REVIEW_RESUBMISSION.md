# App Review resubmission — ticket DAC553139 (rejected 2026-09-01)

Apple rejected build 58 on five points. Two are the same root cause (subscriptions not
submitted with the binary), one is a Clerk configuration problem, and two are metadata.

| Guideline | What Apple saw | Root cause | Fix |
|---|---|---|---|
| 2.1(a) | "Please fill in all required fields" on Welcome step 2 (see Apple's screenshot) | ZIP code is validated as required but was not marked with `*`, so the reviewer left it blank | Fixed in `app/welcome.tsx` |
| 2.1(b) IAP not submitted | Subscriptions referenced but not submitted | Both subscriptions are "Ready to Submit" in App Store Connect but were never attached to the app version | Attach them to the version and submit together |
| 2.1(b) purchase error | "Error 10: A network error has occurred" on the paywall (Apple's screenshot) | RevenueCat error 10 = the device could not reach `api.revenuecat.com` after the StoreKit purchase, so the receipt was never posted and no entitlement was granted. Unsubmitted IAPs may also contribute. | App now re-syncs the receipt on purchase error; submit the IAPs; see step 5 |
| 3.1.2(c) | Subscription doesn't say what you get | Product description was "Continuous data removal, billed monthly"; RevenueCat's bare default paywall opened immediately | Product descriptions updated; app now shows the benefits screen before the purchase sheet |
| 2.3.2 | Metadata doesn't say a purchase is required | App Store description never mentions the subscription | Description copy below |

## Already done

- `app/welcome.tsx`: ZIP code is now labelled as required (it was already enforced).
- `components/paywall/paywall.tsx`: on a purchase error the app restores/re-syncs the App Store
  receipt and lets the user through if the entitlement is present, instead of dead-ending.
- `app/paywall.tsx`: the plan-details screen (benefits, both prices, renewal terms, Terms/Privacy links)
  now shows first. "See plans" opens the RevenueCat purchase sheet.
- Attempted to update the two subscription descriptions through RevenueCat; App Store Connect
  rejected the write ("The field (NAME) can not be modified"). Do it by hand — see step 1.
- Type/lint errors fixed in `components/screens/index.ts` and `components/ui/Logo.tsx`.

## To do before resubmitting

### 1. App Store Connect — attach and submit the subscriptions
1. Open the app → the new version → scroll to **In-App Purchases and Subscriptions** → **+** →
   select **Premium Monthly** (`com.zerotracelabs.app.premium.monthly`) and
   **Premium Annual** (`com.zerotracelabs.app.premium.annual`).
2. For each subscription open **App Store Localization → English (U.S.)** and change the
   **Description** (45 chars max) from "Continuous data removal, billed monthly/yearly" to
   `Ongoing data broker removal & monitoring` (Guideline 3.1.2(c)).
3. Both already have a review screenshot and review notes. Confirm each shows **Ready to Submit**.
4. **Business → Agreements**: confirm the **Paid Apps Agreement** is Active (Account Holder must accept).
5. Submit the version and the two subscriptions in the same submission.

### 2. App Store Connect — metadata (Guideline 2.3.2)
Add this paragraph to the **Description** (and keep it in Promotional Text if you use it):

> 0Trace Labs requires an auto-renewable subscription to run removals. Plans: Premium
> Monthly at $14.99/month or Premium Annual at $149.99/year. Payment is charged to your
> Apple ID at confirmation of purchase. The subscription renews automatically unless
> cancelled at least 24 hours before the end of the current period. Manage or cancel in
> your App Store account settings. Terms of Use: https://www.0tracelabs.com/terms-of-service
> · Privacy Policy: https://www.0tracelabs.com/privacy-policy

Also set **App Information → License Agreement** (or leave Apple's standard EULA) and make
sure the **Privacy Policy URL** and **Terms of Use (EULA)** fields under the version's
metadata are filled with the URLs above.

### 3. App Store Connect — App Review Information
Give the reviewer a working account so sign-up is not on the critical path:

1. In the app, create a demo user (suggested: `appreview@0tracelabs.com`, strong unique
   password). Complete the Welcome flow.
2. Grant that account Premium without a purchase: RevenueCat → Customers → search the
   Clerk user id (`user_…`) → **Grant promotional entitlement** → `Premium`, 1 year.
   (Or share the Clerk user id and it can be granted via the RevenueCat API.)
3. In **App Review Information** enter the credentials and these notes:

> Sign in with the demo account above (it already has an active Premium plan). To test
> purchasing, sign up with a new account instead; the paywall appears after onboarding.
> Purchases use RevenueCat over StoreKit; both subscriptions are attached to this version.
> Sign-up requires email verification; the demo account skips that. Note: sign-up
> rejects passwords found in known data breaches — please use a unique password.

### 4. Clerk dashboard (secondary — the reviewer got past Clerk sign-up this time)
Apple's screenshot shows the reviewer reached Welcome step 2, so Clerk sign-up worked on
2026-08-31. The earlier rejection was a Clerk password rejection, so still confirm these:

1. **Native API** must be enabled: https://dashboard.clerk.com/~/native-applications.
   Without it, native sign-ups that Clerk flags as bot traffic (Apple's review network
   often is) fail with `captcha_unavailable` / `captcha_invalid`.
2. **Protect → Rules → Bot sign-up protection**: turn off, or at least confirm Native API
   bypass is on.
3. **User & Authentication → Password → Reject compromised passwords**: turn OFF for the
   resubmission. Apple testers use simple passwords; this is the check that failed last time.
4. **Email → Block disposable / subaddressed emails**: turn off (reviewers use unusual addresses).
5. Re-test on an iPad (fresh install) with a weak password such as `Password123` and an
   address like `name+test@gmail.com` and confirm account creation succeeds.

### 5. RevenueCat — purchase "Error 10" and the webhook
**Error 10 (network error).** The reviewer's iPad could not reach RevenueCat's API after the
App Store charge. Options, in order of preference:
1. Retest on a real iPad with a sandbox Apple ID and watch the RevenueCat debug log for the
   failing request.
2. If it recurs, RevenueCat's documented fallback for blocked/unreliable routes is the proxy
   host: call `Purchases.setProxyURL('https://api.rc-backup.com/')` before `configure()`.
3. Either way, the app now retries via a receipt sync on purchase error, and Restore Purchases
   on the plan screen also re-posts the receipt.

**Webhook — fixed 2026-09-09.** The RevenueCat webhook now points at
`https://standing-swordfish-884.convex.site/revenuecat-webhook` with the Authorization header
matching the prod `REVENUECAT_WEBHOOK_AUTH_HEADER` (verified: correct header → 200, wrong → 401).
The stale webhook to the dead `admired-hippopotamus-445` deployment was deleted.

Gotchas learned while fixing it:
- `npx convex env …` **without `--prod`** talks to the dev deployment even though `.env.local`
  names `prod:standing-swordfish-884`. Always pass `--prod` for anything production.
- The prod deployment is shared with the web app repo (`app-zero-trace-labs`) and its
  functions are deployed from there. The `convex/` changes in this repo (fail-closed webhook,
  `ENFORCE_SUBSCRIPTIONS` gating) are **not** on prod. Deploying from this repo would replace
  the web app's functions — reconcile the two `convex/` folders before running `convex deploy`.

### 6. Build and submit
```bash
eas build --platform ios --profile production   # buildNumber auto-increments
eas submit --platform ios --profile production
```
Then reply in Resolution Center summarising: subscriptions attached, sign-up fix, demo account.

## Still open (not blocking review)
- `convex/scanner.ts` and `app/data-for-nerds.tsx` have pre-existing implicit-`any` type errors.
- The current RevenueCat offering has no designed paywall attached (the "0TraceLabs" paywall
  is on the non-current `ios-app-store` offering, which only sells the old Basic product).
  The SDK falls back to a default template. Attach a paywall to the `default` offering when
  convenient.

---

# Resubmission — submission 66c09b40 (build 59, rejected 2026-09-11)

One issue: **Guideline 5.1.1(v)** — the app required Address / City / State / ZIP during
onboarding. Apple considers these non-essential for the core service and requires them to
be optional.

## Already done (this repo)
- `app/welcome.tsx`: Address line 1, City, State and ZIP no longer carry the required marker,
  step 2 validates only first and last name, blank address fields are sent as `undefined`,
  and a note above the address block says the address is optional but improves matching.
- No backend change needed: `users.upsertProfile` and the schema already treat every address
  field as optional, and `scanner.ts` searches by name alone when no address exists.

## To do
1. Commit and push the change.
2. Build: `eas build --platform ios --profile production` (auto-increments to build 60).
3. Verify on the EAS build or a simulator: sign up with a fresh account, on "Let's get started"
   enter only first and last name, tap Next, confirm it advances with no error and the address
   note is visible. Also confirm entering a full address still saves.
4. Submit: `eas submit --platform ios --profile production`, then in App Store Connect attach
   build 60 to version 1.0 (the version stays; only the build changes). Keep the two
   subscriptions attached to the version if they are not yet approved.
5. App Review Information → Notes: add the paragraph below.
6. Reply in the Resolution Center thread for submission 66c09b40 with the same paragraph and
   resubmit for review.

## Reviewer note / Resolution Center reply
> Thank you for the review. We have updated the onboarding flow so that address, city, state
> and ZIP code are no longer required. Only first and last name are required, since our
> service searches data-broker sites for the user's listings and needs a name to do so. The
> address fields remain available as optional inputs (labelled as optional) because they
> improve match accuracy, but the app proceeds and functions fully without them. This is in
> build 60. All other functionality is unchanged from the previously reviewed build.
