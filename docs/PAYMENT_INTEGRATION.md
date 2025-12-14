# Payment Integration Guide: Superwall + Whop + Supabase

This document explains how the payment system works in the 0Trace Labs mobile app.

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   MOBILE APP                         │
│  ┌────────────────────────────────────────────────┐  │
│  │         Superwall Paywall UI                   │  │
│  │  - Displays pricing plans                      │  │
│  │  - A/B testing capabilities                    │  │
│  │  - Native payment processing                   │  │
│  └────────────────┬───────────────────────────────┘  │
│                   │ User subscribes                  │
│                   ▼                                  │
│  ┌────────────────────────────────────────────────┐  │
│  │         Whop SDK (Payment)                     │  │
│  │  - Processes subscription payment              │  │
│  │  - Creates membership                          │  │
│  │  - Returns purchase confirmation               │  │
│  └────────────────┬───────────────────────────────┘  │
│                   │                                  │
│  ┌────────────────┴───────────────────────────────┐  │
│  │    Poll Supabase for Subscription Status       │  │
│  │  - Wait for webhook to update DB               │  │
│  │  - Check customers table                       │  │
│  │  - Verify subscription active                  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                        │
                        │ Whop sends webhook
                        ▼
┌──────────────────────────────────────────────────────┐
│              WEBAPP (app.0tracelabs.com)             │
│  ┌────────────────────────────────────────────────┐  │
│  │         Whop Webhook Handler                   │  │
│  │  - Receives subscription events                │  │
│  │  - Validates webhook signature                 │  │
│  │  - Updates Supabase customers table            │  │
│  └────────────────┬───────────────────────────────┘  │
└────────────────────┼──────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│                    SUPABASE                          │
│  ┌────────────────────────────────────────────────┐  │
│  │         customers table                        │  │
│  │  - subscription_status                         │  │
│  │  - has_app_access                              │  │
│  │  - whop_membership_id                          │  │
│  │  - access_expires_at                           │  │
│  └────────────────────────────────────────────────┘  │
│                     │ Real-time                      │
│                     │ subscription                   │
│                     ▼                                │
│  ┌────────────────────────────────────────────────┐  │
│  │      Mobile App (via Realtime listener)        │  │
│  │  - Instantly receives subscription updates     │  │
│  │  - Unlocks app features                        │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Components

### 1. Superwall (Paywall UI & A/B Testing)

**Purpose**: Manages the paywall user interface and experimentation

**Files:**
- `lib/superwall.ts` - Superwall service wrapper
- `components/paywall/superwall-paywall.tsx` - Paywall component

**Key Features:**
- No-code paywall editor
- A/B testing for pricing optimization
- Remote configuration (no app updates needed)
- Native iOS and Android SDKs
- Analytics and conversion tracking

**Configuration:**
```typescript
// Initialize Superwall
await initializeSuperwall(userId, userEmail);

// Present paywall
await superwallService.presentPaywall('onboarding_flow', {
  user_id: user.id,
  user_email: user.email,
});
```

**Environment Variables:**
```bash
EXPO_PUBLIC_SUPERWALL_API_KEY=pk_live_xxx
```

**Superwall Dashboard:** https://superwall.com/dashboard

### 2. Whop (Payment Processing)

**Purpose**: Handles actual payment processing and subscription management

**Files:**
- `lib/whop.ts` - Whop service wrapper

**Key Features:**
- Subscription billing
- Membership management
- Checkout sessions
- Webhook events for subscription lifecycle

**Environment Variables:**
```bash
EXPO_PUBLIC_WHOP_ANNUAL_PLAN_ID=plan_annual_xxx
EXPO_PUBLIC_WHOP_MONTHLY_PLAN_ID=plan_monthly_xxx
```

**Whop Dashboard:** https://whop.com/dashboard

**Important:** The actual Whop SDK implementation needs to be completed. Currently, the app has placeholder code that needs to be replaced with:
1. Whop's React Native SDK checkout flow, OR
2. Web-based checkout via WebView/in-app browser

### 3. Supabase (Database & Auth)

**Purpose**: Single source of truth for user subscription status

**Database Table:** `customers`

**Key Fields:**
```sql
- user_id: UUID (links to auth.users)
- subscription_status: 'active' | 'cancelled' | 'expired' | 'trialing' | 'past_due'
- has_app_access: BOOLEAN
- whop_membership_id: TEXT
- whop_plan_id: TEXT
- plan_name: TEXT
- access_expires_at: TIMESTAMP
```

**Files:**
- `lib/stores/subscription-store.ts` - Subscription state management
- `lib/supabase.ts` - Supabase client configuration

**Row Level Security (RLS):**
```sql
-- Users can only read their own customer record
CREATE POLICY "Users can view own customer data"
  ON customers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can write (webhooks use service role key)
CREATE POLICY "Only service can modify customer data"
  ON customers
  FOR ALL
  USING (false);
```

### 4. Webapp Webhooks (app.0tracelabs.com)

**Purpose**: Receives Whop events and updates Supabase

**Webhook Endpoints (on your webapp):**
- `/api/webhooks/whop` - Receives subscription events

**Events Handled:**
- `membership.created` - New subscription
- `membership.updated` - Plan changes
- `membership.cancelled` - Cancellation
- `membership.expired` - Expiration
- `payment.succeeded` - Successful payment
- `payment.failed` - Failed payment

**Webhook updates:**
```javascript
// Example webhook handler
await supabase
  .from('customers')
  .upsert({
    user_id: userId,
    subscription_status: 'active',
    has_app_access: true,
    whop_membership_id: membershipId,
    whop_plan_id: planId,
    plan_name: planName,
  });
```

## User Flow

### New User Subscribing

1. **User opens app** → Signs up/in with email/password
2. **Completes onboarding** → Sees scan results
3. **Reaches paywall** → Clicks "VIEW PRICING OPTIONS"
4. **Superwall presents paywall** → Beautiful native UI with pricing
5. **User selects plan** → Chooses Annual ($19/mo) or Monthly ($29/mo)
6. **Whop processes payment** → Native payment sheet
7. **Payment succeeds** → Whop creates membership
8. **Mobile app polls database** → Checks `customers` table every 2 seconds
9. **Webhook updates Supabase** → Webapp receives Whop event, updates DB
10. **Mobile app detects subscription** → `has_app_access = true`
11. **Access granted** → User sees dashboard

### Existing Subscriber

1. **User opens app** → Signs in
2. **ProtectedRoute checks subscription** → Queries `customers` table
3. **Active subscription found** → Redirect to dashboard
4. **Real-time listener active** → Receives updates if subscription changes

### Subscription Cancelled

1. **User cancels on web** → Whop membership updated
2. **Webhook fires** → Webapp receives `membership.cancelled`
3. **Database updated** → `subscription_status = 'cancelled'`
4. **Real-time event** → Mobile app receives update instantly
5. **Access revoked** → User redirected to paywall (or grace period)

## Implementation Checklist

### ✅ Completed

- [x] Superwall SDK installed
- [x] Whop SDK installed (needs implementation)
- [x] Subscription store created
- [x] Supabase customers table integration
- [x] Real-time subscription listener
- [x] Protected route with subscription check
- [x] Superwall paywall component
- [x] Auth provider with Superwall initialization
- [x] Environment variables documented

### ⚠️ TODO (Required for Production)

- [ ] **Configure Superwall Dashboard**
  - Create account at https://superwall.com
  - Set up paywall designs
  - Configure pricing experiments
  - Get API key and add to `.env`

- [ ] **Configure Whop Dashboard**
  - Create plans (Annual & Monthly)
  - Get plan IDs and add to `.env`
  - Set up webhook endpoint URL (your webapp)
  - Configure webhook secret for validation

- [ ] **Implement Whop SDK Purchase Flow**
  - Research Whop's React Native SDK documentation
  - Implement checkout in `lib/whop.ts`
  - Test purchase flow end-to-end
  - Handle error cases

- [ ] **Set up Supabase RLS Policies**
  - Enable RLS on `customers` table
  - Create read policy for authenticated users
  - Verify service role can write (for webhooks)

- [ ] **Configure Webapp Webhook Handler**
  - Verify webhook endpoint is live
  - Test webhook signature validation
  - Confirm database updates work
  - Monitor webhook logs

- [ ] **Test End-to-End Flow**
  - Test new subscription
  - Test subscription cancellation
  - Test payment failure
  - Test real-time updates
  - Test app access gating

- [ ] **Production Environment Variables**
  - Add Superwall API key to `eas.json`
  - Add Whop plan IDs to `eas.json`
  - Consider using EAS Secrets for security

## Development Workflow

### Local Testing

1. **Start development server:**
   ```bash
   npm start
   ```

2. **Mock paywall for testing:**
   - Superwall won't work fully in dev without valid API key
   - Can test UI by triggering paywall component directly
   - Use Expo Go or development build

3. **Test subscription status:**
   ```bash
   # Manually insert test customer record in Supabase
   INSERT INTO customers (user_id, subscription_status, has_app_access)
   VALUES ('your-user-id', 'active', true);
   ```

### Testing Payment Flow

Since Whop integration isn't complete, here's how to test:

**Option 1: Manual Database Updates**
```sql
-- Simulate successful subscription
UPDATE customers
SET subscription_status = 'active',
    has_app_access = true,
    whop_membership_id = 'test_membership_123'
WHERE user_id = 'your-user-id';
```

**Option 2: Use Web App Checkout**
- Subscribe via webapp
- Webhook updates database
- Mobile app should instantly detect via real-time listener

**Option 3: Test Mode (when Whop SDK implemented)**
- Use Whop test mode API keys
- Process test payments
- Verify webhook delivery

## Troubleshooting

### Paywall Not Showing

**Possible causes:**
- Superwall API key not set
- Superwall not initialized
- Network error

**Debug:**
```javascript
console.log('Superwall initialized:', superwallService.isInitialized());
console.log('User ID:', user?.id);
```

### Purchase Not Detected

**Possible causes:**
- Webhook not firing
- Webhook failing
- Database not updating
- Polling timeout

**Debug:**
1. Check webapp webhook logs
2. Verify Whop webhook endpoint configured
3. Check Supabase `customers` table manually
4. Increase polling timeout in `SuperwallPaywall.tsx`

### Subscription Status Not Updating

**Possible causes:**
- Real-time listener not connected
- RLS policy blocking read
- User ID mismatch

**Debug:**
```javascript
const { customer } = useSubscriptionStore();
console.log('Customer record:', customer);
console.log('Has access:', hasActiveSubscription());
```

### Access Denied Despite Active Subscription

**Possible causes:**
- `has_app_access = false`
- `access_expires_at` in past
- Wrong user_id in customers table

**Debug:**
```sql
SELECT * FROM customers WHERE user_id = 'your-user-id';
```

## Security Considerations

### Client-Side API Keys

All keys in the mobile app are **public** and can be extracted:
- ✅ Superwall API key (safe - designed for client use)
- ✅ Whop plan IDs (safe - just identifiers)
- ✅ Supabase anon key (safe with RLS enabled)

### Backend Security

- ⚠️ **Never** expose Whop webhook secret in mobile app
- ⚠️ **Never** expose Supabase service role key in mobile app
- ✅ Use Row Level Security (RLS) on all tables
- ✅ Validate webhook signatures on backend
- ✅ Only webapp can write to `customers` table

### Subscription Validation

The app checks multiple conditions:
```typescript
hasActiveSubscription() {
  return (
    customer?.has_app_access === true &&
    ['active', 'trialing'].includes(customer?.subscription_status) &&
    (customer?.access_expires_at ? new Date() <= new Date(customer.access_expires_at) : true)
  );
}
```

## Analytics & Monitoring

### Superwall Dashboard

Monitor:
- Paywall impressions
- Conversion rate
- Revenue metrics
- A/B test performance

### Whop Dashboard

Monitor:
- Active subscriptions
- MRR/ARR
- Churn rate
- Payment failures
- Webhook delivery

### Supabase

Monitor:
- Real-time connections
- Query performance
- RLS policy violations
- Database size

## Next Steps

1. **Get Superwall API Key**
   - Sign up at https://superwall.com
   - Create a project
   - Design your paywall
   - Copy API key to `.env`

2. **Get Whop Plan IDs**
   - Sign up at https://whop.com
   - Create products/plans
   - Copy plan IDs to `.env`

3. **Implement Whop SDK**
   - Follow Whop's React Native docs
   - Complete `lib/whop.ts` implementation
   - Test purchase flow

4. **Test End-to-End**
   - Make a test purchase
   - Verify webhook delivery
   - Confirm database update
   - Validate app access granted

5. **Deploy**
   - Add keys to `eas.json` or EAS Secrets
   - Build production app: `eas build --platform all --profile production`
   - Submit to App Store / Play Store

## Resources

- [Superwall Documentation](https://docs.superwall.com)
- [Whop Documentation](https://docs.whop.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native](https://reactnative.dev/)
