# Webapp API Requirements for Mobile Checkout

Your mobile app needs a simple API endpoint on your webapp to create Whop checkout sessions.

## Required API Endpoint

### POST `/api/checkout/create`

**Purpose:** Creates a Whop checkout URL for the mobile app to open

**Request:**
```typescript
{
  plan_id: string;        // Whop plan ID (e.g., "plan_xxxxx")
  user_id: string;        // Supabase user ID
  email: string;          // User's email
  full_name?: string;     // Optional user name
  source: 'mobile_app';   // Source identifier
}
```

**Response:**
```typescript
{
  checkout_url: string;   // Whop checkout URL to open
  session_id?: string;    // Optional session ID for tracking
}
```

**Example Request:**
```bash
curl -X POST https://app.0tracelabs.com/api/checkout/create \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "plan_xxxxx",
    "user_id": "user-uuid-here",
    "email": "user@example.com",
    "full_name": "John Doe",
    "source": "mobile_app"
  }'
```

**Example Response:**
```json
{
  "checkout_url": "https://whop.com/checkout/plan_xxxxx?prefilled_email=user@example.com",
  "session_id": "session_123abc"
}
```

---

## Implementation Guide

### Option 1: Simple Redirect (Easiest)

If you already have a checkout page, just return a URL to it:

```typescript
// api/checkout/create.ts
export async function POST(request: Request) {
  const { plan_id, user_id, email, full_name } = await request.json();

  // Build checkout URL with query params
  const checkoutUrl = `https://app.0tracelabs.com/checkout?` +
    `plan=${plan_id}` +
    `&email=${encodeURIComponent(email)}` +
    `&userId=${user_id}` +
    `&source=mobile`;

  return Response.json({
    checkout_url: checkoutUrl,
  });
}
```

### Option 2: Whop API Integration (Better)

Create a Whop checkout session via their API:

```typescript
// api/checkout/create.ts
import { createWhopCheckout } from '@/lib/whop-server';

export async function POST(request: Request) {
  const { plan_id, user_id, email, full_name } = await request.json();

  try {
    // Create Whop checkout session via their API
    const checkout = await createWhopCheckout({
      planId: plan_id,
      email: email,
      metadata: {
        userId: user_id,
        source: 'mobile_app',
      },
    });

    return Response.json({
      checkout_url: checkout.url,
      session_id: checkout.id,
    });

  } catch (error) {
    console.error('Checkout creation failed:', error);
    return Response.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### Option 3: Use Existing Logic (Best)

If you already create checkouts for your web app, reuse that:

```typescript
// api/checkout/create.ts
import { createCheckoutSession } from '@/lib/checkout';

export async function POST(request: Request) {
  const { plan_id, user_id, email, full_name } = await request.json();

  // Reuse your existing checkout logic
  const session = await createCheckoutSession({
    planId: plan_id,
    userId: user_id,
    email: email,
    fullName: full_name,
    source: 'mobile_app',
  });

  return Response.json({
    checkout_url: session.url,
    session_id: session.id,
  });
}
```

---

## What Happens After

1. **Mobile app calls your API** → Gets checkout URL
2. **Opens in-app browser** → User completes payment on Whop
3. **Whop sends webhook to your app** → Updates Supabase `customers` table
4. **Mobile app polls Supabase** → Detects subscription is active
5. **Access granted!** → User sees dashboard

---

## Testing

### Test the Endpoint

```bash
# Replace with your actual values
curl -X POST http://localhost:3000/api/checkout/create \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "plan_free_tier_id",
    "user_id": "test-user-id",
    "email": "test@example.com",
    "source": "mobile_app"
  }'
```

**Expected Response:**
```json
{
  "checkout_url": "https://whop.com/checkout/..."
}
```

### Test from Mobile App

1. Start your dev server: `npm start`
2. Sign in to the app
3. Reach the paywall
4. Click a plan
5. Should open in-app browser with checkout
6. Complete payment
7. App should detect subscription

---

## Security Considerations

### ✅ Safe to Expose
- Plan IDs (they're public identifiers)
- User email (already known)
- User ID (for webhook matching)

### ⚠️ Keep Secret
- Whop API keys (server-side only)
- Webhook signing secrets
- Service role keys

### 🔒 Recommendations
1. **Rate limit** the endpoint (prevent abuse)
2. **Validate** the user_id is a real Supabase user
3. **Log** all checkout creations for debugging
4. **Handle errors** gracefully

---

## Error Handling

Return appropriate HTTP status codes:

```typescript
// Success
return Response.json({ checkout_url: url }, { status: 200 });

// Invalid request
return Response.json({ error: 'Missing plan_id' }, { status: 400 });

// Server error
return Response.json({ error: 'Checkout failed' }, { status: 500 });
```

Mobile app will display error alerts to the user.

---

## Minimal Example (Copy & Paste)

```typescript
// app/api/checkout/create/route.ts (Next.js App Router)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan_id, user_id, email } = body;

    // Validate required fields
    if (!plan_id || !user_id || !email) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build checkout URL (replace with your actual checkout page)
    const checkoutUrl = new URL('https://app.0tracelabs.com/checkout');
    checkoutUrl.searchParams.set('plan', plan_id);
    checkoutUrl.searchParams.set('email', email);
    checkoutUrl.searchParams.set('userId', user_id);
    checkoutUrl.searchParams.set('source', 'mobile');

    return Response.json({
      checkout_url: checkoutUrl.toString(),
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Next Steps

1. **Create the endpoint** on your webapp
2. **Test it** with curl
3. **Test from mobile app** with a real purchase
4. **Verify webhook** fires and updates database
5. **Confirm mobile app** detects subscription

---

## Need Help?

Check that:
- [ ] Endpoint exists at `/api/checkout/create`
- [ ] Returns valid JSON with `checkout_url`
- [ ] Checkout URL opens in browser
- [ ] Payment completes successfully
- [ ] Webhook fires and updates Supabase
- [ ] Mobile app polls and detects subscription

If webhook isn't updating the database, check:
- Whop webhook endpoint URL is correct
- Webhook signature validation works
- Database RLS policies allow updates (service role)
- Logs show webhook received

Good luck! 🚀
