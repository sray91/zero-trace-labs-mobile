# Quick Start: Setting Up Payments

This guide will help you complete the payment integration for the 0Trace Labs mobile app.

## What's Already Done ✅

Your mobile app now has:
- ✅ Superwall SDK installed and configured
- ✅ Whop SDK installed (needs completion - see below)
- ✅ Subscription state management
- ✅ Real-time subscription updates from Supabase
- ✅ Paywall UI that triggers on onboarding
- ✅ Database integration with your `customers` table
- ✅ Auth integration

## What You Need To Do

### Step 1: Get Superwall API Key (15 minutes)

1. **Sign up at Superwall:**
   - Go to https://superwall.com
   - Create an account
   - Create a new project

2. **Design your paywall:**
   - Use the no-code editor to create your paywall
   - Add your two plans:
     - Annual Nuke: $19/mo (billed annually = $228/year)
     - Monthly Strike: $29/mo
   - Customize colors, copy, and layout to match your app

3. **Get your API key:**
   - Navigate to Settings → API Keys
   - Copy your **Publishable Key** (starts with `pk_`)

4. **Add to your `.env` file:**
   ```bash
   EXPO_PUBLIC_SUPERWALL_API_KEY=pk_your_actual_key_here
   ```

### Step 2: Get Whop Plan IDs (10 minutes)

1. **Sign up at Whop:**
   - Go to https://whop.com
   - Create a seller account

2. **Create your products:**
   - Create three subscription products:
     - **Free Trial**: Free (7-day trial)
     - **Basic**: $14.99/month
     - **Premium**: $29.99/month
   - Note the Plan IDs for each (format: `plan_xxxxx`)

3. **Add to your `.env` file:**
   ```bash
   EXPO_PUBLIC_WHOP_FREE_PLAN_ID=plan_xxxxx
   EXPO_PUBLIC_WHOP_BASIC_PLAN_ID=plan_yyyyy
   EXPO_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_zzzzz
   ```

### Step 3: Configure Whop Webhooks (10 minutes)

1. **In Whop Dashboard:**
   - Go to Settings → Webhooks
   - Click "Add Webhook"
   - Enter your webapp URL: `https://app.0tracelabs.com/api/webhooks/whop`
   - Select events:
     - `membership.created`
     - `membership.updated`
     - `membership.cancelled`
     - `membership.expired`
     - `payment.succeeded`
     - `payment.failed`
   - Copy the **Webhook Secret** (you'll need this for your webapp)

2. **Verify your webapp webhook handler is ready:**
   - Confirm `/api/webhooks/whop` endpoint exists
   - Test it receives and processes events correctly
   - Verify it updates the Supabase `customers` table

### Step 4: Implement Whop Purchase Flow (30-60 minutes)

**Current Status:** The Whop SDK is installed, but the purchase flow needs to be implemented.

**Location to update:** `lib/whop.ts` (line 32-50)

**Option A: Use Whop React Native SDK**

If Whop has a React Native SDK, implement it like this:

```typescript
import WhopSDK from '@whop/react-native-sdk'; // Check Whop docs for exact package

async initiatePurchase(params: WhopPurchaseParams): Promise<WhopPurchaseResult> {
  try {
    const result = await WhopSDK.checkout({
      planId: params.planId,
      email: params.email,
      metadata: {
        userId: params.userId,
        planName: params.planName,
      }
    });

    return {
      success: true,
      checkoutSessionId: result.sessionId,
      membershipId: result.membershipId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

**Option B: Web Checkout (Simpler)**

If no React Native SDK exists, use WebView or browser:

```typescript
import * as Linking from 'expo-linking';

async initiatePurchase(params: WhopPurchaseParams): Promise<WhopPurchaseResult> {
  try {
    // Create checkout session via your webapp API
    const checkoutUrl = await this.createCheckoutSession(params);

    // Open in browser
    await Linking.openURL(checkoutUrl);

    // Return pending - will be completed via webhook
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

**Check Whop Documentation:**
- Visit https://docs.whop.com/developer/guides/react-native
- Follow their integration guide
- Implement according to their best practices

### Step 5: Set Up Supabase RLS (10 minutes)

Protect your `customers` table with Row Level Security:

```sql
-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own customer data"
  ON customers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (for webhooks)
-- This is the default - no INSERT/UPDATE policies means only service role can write
```

Test it works:
```sql
-- Should work (as authenticated user)
SELECT * FROM customers WHERE user_id = auth.uid();

-- Should fail (as authenticated user)
UPDATE customers SET subscription_status = 'active' WHERE user_id = auth.uid();
```

### Step 6: Test the Complete Flow (30 minutes)

1. **Start the dev server:**
   ```bash
   npm start
   ```

2. **Test the flow:**
   - Sign up with a test email
   - Complete the onboarding scan
   - Reach the paywall
   - Click "VIEW PRICING OPTIONS"
   - Verify Superwall paywall appears
   - Attempt a test purchase

3. **Verify database updates:**
   - Check Supabase `customers` table
   - Confirm webhook fired and updated record
   - Verify `subscription_status = 'active'`
   - Verify `has_app_access = true`

4. **Verify app access:**
   - App should detect subscription
   - User should see dashboard
   - Real-time updates should work

### Step 7: Deploy to Production (30 minutes)

1. **Update `eas.json` with production keys:**

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://tdfjmlbzabpjazczbdud.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_key",
        "EXPO_PUBLIC_SUPERWALL_API_KEY": "pk_live_your_production_key",
        "EXPO_PUBLIC_WHOP_ANNUAL_PLAN_ID": "plan_annual_xxx",
        "EXPO_PUBLIC_WHOP_MONTHLY_PLAN_ID": "plan_monthly_xxx"
      }
    }
  }
}
```

2. **Build the app:**
   ```bash
   # Install EAS CLI
   npm install -g eas-cli

   # Login
   eas login

   # Build for production
   eas build --platform all --profile production
   ```

3. **Submit to stores:**
   ```bash
   # iOS App Store
   eas submit --platform ios

   # Google Play Store
   eas submit --platform android
   ```

## Architecture Summary

```
User subscribes → Superwall UI → Whop processes payment →
Webhook to webapp → Webapp updates Supabase →
Mobile app detects change (real-time) → Access granted
```

**Mobile app responsibilities:**
- ✅ Display Superwall paywall
- ✅ Trigger Whop purchase
- ✅ Poll/listen for subscription status
- ✅ Gate access based on subscription

**Webapp responsibilities:**
- ⚠️ Receive Whop webhooks (YOU NEED TO VERIFY THIS WORKS)
- ⚠️ Update Supabase customers table
- ⚠️ Handle subscription lifecycle

**Whop responsibilities:**
- ✅ Process payments
- ✅ Manage subscriptions
- ✅ Send webhooks

**Supabase responsibilities:**
- ✅ Store subscription status (single source of truth)
- ✅ Real-time updates to mobile app
- ✅ Row Level Security

## Troubleshooting

### "Superwall paywall not showing"
- Verify API key is set correctly
- Check console logs for errors
- Ensure you're running on a device (not just web)

### "Purchase completes but access not granted"
- Check webapp webhook logs - did it receive the event?
- Check Supabase customers table - was it updated?
- Check polling timeout in `SuperwallPaywall.tsx` - increase if needed
- Verify real-time listener is connected

### "Access denied even with active subscription"
- Query `customers` table manually: `SELECT * FROM customers WHERE user_id = 'xxx'`
- Verify `has_app_access = true`
- Verify `subscription_status IN ('active', 'trialing')`
- Check `access_expires_at` is not in the past

## Important Notes

⚠️ **Whop SDK Implementation Required**
- The Whop purchase flow is currently a placeholder
- You must implement it according to Whop's documentation
- Check if Whop has a React Native SDK or use web checkout

⚠️ **Webhook Handler Critical**
- Your webapp MUST have working webhook handlers
- This is the only way subscriptions get activated
- Test webhook delivery thoroughly

⚠️ **Environment Variables**
- Development: Use `.env` file
- Production: Use `eas.json` or EAS Secrets
- Never commit real API keys to git

## Resources

- **Full Documentation:** `docs/PAYMENT_INTEGRATION.md`
- **Environment Variables:** `docs/ENVIRONMENT_VARIABLES.md`
- **Superwall Docs:** https://docs.superwall.com
- **Whop Docs:** https://docs.whop.com
- **Supabase Docs:** https://supabase.com/docs

## Getting Help

If you run into issues:

1. Check the detailed docs: `docs/PAYMENT_INTEGRATION.md`
2. Review console logs in the mobile app
3. Check webapp webhook logs
4. Verify Supabase database state
5. Test each component individually

Good luck! 🚀
