# Clerk Migration Guide

## Overview

The 0Trace Labs mobile app has been migrated from Supabase Auth to Clerk Auth. This document outlines the changes made and next steps.

## What Changed

### Dependencies
- **Added**: `@clerk/clerk-expo` (installed with `--legacy-peer-deps` due to React 19 compatibility)
- **Kept**: `@supabase/supabase-js` (still used for data storage, not auth)

### Files Modified

1. **lib/clerk.ts** (NEW)
   - Clerk client configuration
   - Token cache using SecureStore for native platforms
   - Exports publishable key and token cache

2. **app/_layout.tsx**
   - Wrapped app with `<ClerkProvider>`
   - Clerk provider sits outside ThemeProvider

3. **lib/stores/auth-store.ts**
   - Replaced Supabase auth methods with Clerk hooks
   - Created `useClerkAuth()` hook that syncs Clerk state to Zustand store
   - Maintains same auth state structure for backwards compatibility

4. **components/providers/auth-provider.tsx**
   - Updated to use `useClerkAuth()` instead of Supabase
   - Superwall initialization now uses Clerk user data

5. **components/auth/protected-route.tsx**
   - Updated to use `isSignedIn` from auth store instead of `user` check
   - Navigation logic remains the same

6. **components/screens/login-screen.tsx**
   - Uses `useSignIn()` from Clerk
   - Handles sign in with email/password
   - Error handling adapted for Clerk error format

7. **components/screens/signup-screen.tsx**
   - Uses `useSignUp()` from Clerk
   - Implements email verification flow with code
   - Two-step process: signup → verify email

8. **components/screens/forgot-password-screen.tsx**
   - Uses `useSignIn()` with reset password strategy
   - Two-step process: send code → reset password with code
   - Different from Supabase's single email link approach

9. **app/(tabs)/settings.tsx**
   - Updated to use `useClerkAuth()`
   - User object structure changed:
     - `user.email` → `user.primaryEmailAddress.emailAddress`
     - `user.created_at` → `user.createdAt`

10. **.env**
    - Added `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
    - Kept Supabase variables (still used for data)

## Next Steps

### 1. Set Up Clerk Account

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Choose "React Native (Expo)" as the application type
4. Copy the **Publishable Key**
5. Update `.env` file:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

### 2. Configure Clerk Settings

In the Clerk Dashboard:

1. **Email, Phone, Username** → Enable email authentication
2. **Email Settings** → Configure email templates (welcome, verification, password reset)
3. **User & Authentication** → Set password requirements (minimum 8 characters is configured in the app)
4. **Sessions** → Configure session lifetime
5. **Security** → Enable bot protection if needed

### 3. Test Auth Flow

Test all authentication flows:

- [x] Sign up with email verification
- [x] Sign in with email/password
- [x] Password reset flow
- [x] Sign out
- [x] Protected routes redirect to login
- [x] Authenticated users redirect from auth pages to app

### 4. Data Migration (if needed)

If you have existing users in Supabase Auth:

1. Export user data from Supabase
2. Use Clerk's bulk user import API
3. Or: Keep both systems running temporarily and migrate users on first login

### 5. Update Subscription Store (if needed)

The subscription store (`lib/stores/subscription-store.ts`) may need updates if it's currently using Supabase Auth's user ID. You'll need to:

1. Check if subscription data is keyed by Supabase user ID
2. If so, update the schema or add a mapping layer
3. Ensure Clerk user IDs are stored with subscriptions

### 6. Remove Old Supabase Auth Code (optional)

Once everything is tested and working:

1. Review `lib/supabase.ts` - keep the client but remove auth-specific config
2. Check for any remaining Supabase auth imports
3. Remove unused Supabase auth dependencies if desired

## Key Differences: Supabase vs Clerk

### User Object Structure

**Supabase:**
```typescript
{
  id: string;
  email: string;
  created_at: string;
  ...
}
```

**Clerk:**
```typescript
{
  id: string;
  primaryEmailAddress: {
    emailAddress: string;
  };
  emailAddresses: Array<...>;
  createdAt: number;
  ...
}
```

### Authentication Flows

**Supabase:**
- Email/password → immediate login
- Password reset → email link → redirect

**Clerk:**
- Email/password → verify code → login
- Password reset → email code → enter code + new password → done

### Session Management

**Supabase:**
- JWT tokens in secure storage
- Manual refresh handling

**Clerk:**
- Automatic session management
- Built-in token refresh
- Multi-session support

## Troubleshooting

### "Missing Publishable Key" Error

Make sure `.env` file has the Clerk key and restart Expo:
```bash
npm start --clear
```

### React 19 Peer Dependency Warning

The `--legacy-peer-deps` flag was used during installation. This is safe and expected until Clerk officially supports React 19.

### User ID Mismatch in Database

If subscriptions or other data are tied to Supabase user IDs, you'll need to handle the migration:
- Option 1: Update records to use Clerk user IDs
- Option 2: Add a user mapping table
- Option 3: Use Clerk's custom metadata to store Supabase ID

## Support

- **Clerk Docs**: [https://clerk.com/docs/quickstarts/expo](https://clerk.com/docs/quickstarts/expo)
- **Clerk Discord**: [https://clerk.com/discord](https://clerk.com/discord)
