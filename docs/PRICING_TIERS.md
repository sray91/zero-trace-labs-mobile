# 0Trace Labs - Pricing Tiers

## Three-Tier Pricing Structure

Your app now supports a three-tier pricing model with a **free trial** to maximize conversions!

---

## 🎯 Tier Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     FREE TRIAL                               │
│                   "START HERE"                               │
├──────────────────────────────────────────────────────────────┤
│  Price:        FREE                                          │
│  Duration:     7 days                                        │
│  Badge:        "START HERE"                                  │
│                                                              │
│  Features:                                                   │
│  ✓ Basic scans                                              │
│  ✓ Limited removals                                         │
│  ✓ No credit card required                                  │
│                                                              │
│  Perfect for: First-time users to try the service           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       BASIC                                  │
│                "Essential Protection"                        │
├──────────────────────────────────────────────────────────────┤
│  Price:        $14.99/month                                 │
│  Billing:      Monthly                                       │
│                                                              │
│  Features:                                                   │
│  ✓ Monthly detonation sweeps                                │
│  ✓ Standard broker blocking                                 │
│  ✓ Email support                                            │
│                                                              │
│  Perfect for: Individual users on a budget                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      PREMIUM                                 │
│                  "MOST POPULAR"                              │
├──────────────────────────────────────────────────────────────┤
│  Price:        $29.99/month                                 │
│  Billing:      Monthly                                       │
│  Badge:        "MOST POPULAR"                                │
│                                                              │
│  Features:                                                   │
│  ✓ On-demand wipes                                          │
│  ✓ Dark web surveillance                                    │
│  ✓ Priority response                                        │
│  ✓ 24/7 monitoring                                          │
│                                                              │
│  Perfect for: Users wanting maximum protection              │
└──────────────────────────────────────────────────────────────┘
```

---

## 💡 Conversion Strategy

### Free Trial Benefits
1. **Lower Barrier to Entry** - No commitment required
2. **Let Users Experience Value** - 7 days to see results
3. **Build Trust** - Users can verify before paying
4. **Higher Conversion** - Free trials typically convert 25-40%

### Upsell Path
```
Free Trial (7 days)
    ↓
Prompt to upgrade before expiry
    ↓
Basic ($14.99) or Premium ($29.99)
    ↓
Premium offers 2x features for 2x price
```

---

## 🎨 Visual Hierarchy in App

The app displays tiers in this order:

1. **Free Trial** (Green badge: "START HERE")
   - Makes it easy for users to start
   - No friction, no payment required

2. **Basic** (Blue accent)
   - Clear value proposition
   - Affordable monthly option

3. **Premium** (Orange badge: "MOST POPULAR")
   - Anchoring effect (shown after Free and Basic)
   - Best features, positioned as most valuable

---

## 🔧 Implementation Details

### Environment Variables
```bash
EXPO_PUBLIC_WHOP_FREE_PLAN_ID=plan_xxxxx
EXPO_PUBLIC_WHOP_BASIC_PLAN_ID=plan_yyyyy
EXPO_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_zzzzz
```

### Whop Plan Configuration
From your Whop dashboard screenshot:
- ✅ Free Tier: Free (created 20 days ago, 1 member)
- ✅ Basic: $14.99/month (created 2 months ago, 1 member)
- ✅ Premium: $29.99/month (created 2 months ago, 0 members)

### Plan IDs in Code
File: `lib/whop.ts`
```typescript
export const WHOP_PLANS = {
  FREE_TIER: process.env.EXPO_PUBLIC_WHOP_FREE_PLAN_ID || 'plan_free',
  BASIC: process.env.EXPO_PUBLIC_WHOP_BASIC_PLAN_ID || 'plan_basic',
  PREMIUM: process.env.EXPO_PUBLIC_WHOP_PREMIUM_PLAN_ID || 'plan_premium',
} as const;
```

### UI Display
File: `app/(tabs)/index.tsx`
```typescript
const PLAN_CARDS = [
  {
    id: 'free',
    title: 'FREE TRIAL',
    ribbon: 'START HERE',
    price: 'Free',
    cadence: '7-day trial',
    perks: ['Basic scans', 'Limited removals', 'No credit card required'],
  },
  {
    id: 'basic',
    title: 'BASIC',
    price: '$14.99/mo',
    perks: ['Monthly sweeps', 'Standard blocking', 'Email support'],
  },
  {
    id: 'premium',
    title: 'PREMIUM',
    ribbon: 'MOST POPULAR',
    price: '$29.99/mo',
    perks: ['On-demand wipes', 'Dark web surveillance', 'Priority response'],
  },
];
```

---

## 📊 Recommended Superwall Configuration

### Experiment Ideas

**Test 1: Trial Duration**
- Variant A: 7-day trial
- Variant B: 14-day trial
- Measure: Trial → Paid conversion rate

**Test 2: Pricing Display**
- Variant A: Show all three tiers
- Variant B: Show only Basic & Premium (after free trial)
- Measure: Overall conversion rate

**Test 3: Default Selection**
- Variant A: Free trial selected by default
- Variant B: Premium selected by default
- Measure: Revenue per user

**Test 4: Feature Emphasis**
- Variant A: Technical features ("Dark web surveillance")
- Variant B: Benefits-focused ("Sleep better knowing you're protected")
- Measure: Conversion rate

---

## 🎯 Best Practices

### For Free Trial
1. **No Credit Card Required** - Reduces friction
2. **Clear Expiration Notice** - Set expectations
3. **Upgrade Prompts** - Show benefits of paid tiers during trial
4. **Email Reminders** - "2 days left in your trial"

### For Paid Tiers
1. **Annual Option** - Consider adding $149/year (~$12.42/mo) for Basic
2. **Feature Comparison** - Make it easy to see differences
3. **Money-Back Guarantee** - "30-day money-back guarantee"
4. **Social Proof** - "Join 1,000+ protected users"

---

## 📈 Revenue Projections

Assuming 1,000 monthly signups:

**Scenario 1: Conservative**
- Free trial signups: 800 (80%)
- Free → Paid conversion: 20%
- Paid signups: 200
- Average plan: $20/month (mix of Basic & Premium)
- **MRR: $4,000**

**Scenario 2: Optimistic**
- Free trial signups: 900 (90%)
- Free → Paid conversion: 30%
- Paid signups: 270
- Average plan: $24/month (more Premium upgrades)
- **MRR: $6,480**

---

## 🚀 Next Steps

1. **Get Whop Plan IDs**
   - Copy IDs from Whop dashboard
   - Add to `.env` file

2. **Configure Superwall**
   - Create paywall with three tiers
   - Set up A/B tests
   - Track conversion metrics

3. **Test Free Trial Flow**
   - Sign up with test account
   - Verify 7-day access
   - Test upgrade prompts
   - Confirm expiration handling

4. **Monitor Metrics**
   - Free trial signups
   - Trial → Paid conversion
   - Basic vs Premium split
   - Churn rate

---

## 💰 Pricing Psychology

### Why This Works

**Anchoring Effect:**
- Free Trial → Basic seems like a small step
- Basic → Premium is only 2x, but 2x features
- Premium positioned as "Most Popular" (social proof)

**Decoy Effect:**
- Basic serves as middle option
- Makes Premium look like better value
- Free Trial makes everything feel accessible

**Tiered Value Ladder:**
- Free: Try it
- Basic: Use it regularly
- Premium: Depend on it

---

## 🔄 Lifecycle Management

### Free Trial → Basic/Premium
```javascript
// When free trial expires
if (subscription_status === 'expired' && plan_name === 'Free Trial') {
  // Show upgrade prompt
  // Offer discount: "Upgrade now for 20% off first month"
  // Lock app features until upgrade
}
```

### Basic → Premium Upsell
```javascript
// When user tries premium feature
if (plan_name === 'Basic') {
  // Show: "This feature is available in Premium"
  // One-click upgrade button
  // Pro-rated pricing
}
```

---

## 📞 Support Resources

- **Whop Dashboard:** View all active subscriptions
- **Superwall Analytics:** Track paywall conversion rates
- **Supabase Database:** Query subscription distribution

```sql
-- See subscription breakdown
SELECT plan_name, COUNT(*) as count
FROM customers
WHERE subscription_status = 'active'
GROUP BY plan_name;
```

Good luck with your launch! 🚀
