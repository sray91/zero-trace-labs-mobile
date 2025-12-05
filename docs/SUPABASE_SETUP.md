# Supabase Authentication Setup

This document explains the Supabase authentication integration in the ZeroTrace Labs mobile app.

## What Was Set Up

### 1. **Dependencies Installed**
- `@supabase/supabase-js` - Supabase JavaScript client
- `expo-secure-store` - Secure storage for auth tokens on native platforms
- `react-native-url-polyfill` - URL polyfill for React Native

### 2. **Configuration Files**
- `.env` - Contains your Supabase credentials (already configured)
- `.env.example` - Template for environment variables
- `lib/supabase.ts` - Supabase client configuration with secure storage

### 3. **Auth Store** (`lib/stores/auth-store.ts`)
Zustand store managing authentication state with methods:
- `initialize()` - Initialize auth and listen for changes
- `signIn(email, password)` - Sign in with email/password
- `signUp(email, password)` - Create new account
- `signOut()` - Sign out current user
- `resetPassword(email)` - Send password reset email
- `updatePassword(newPassword)` - Update user password
- `updateProfile(data)` - Update user profile

### 4. **Auth Screens**
- **Login** (`app/auth/login.tsx`) - Sign in with email/password
- **Sign Up** (`app/auth/signup.tsx`) - Create new account with email confirmation
- **Forgot Password** (`app/auth/forgot-password.tsx`) - Password reset flow

### 5. **Protected Routes**
- `components/auth/protected-route.tsx` - Automatically redirects:
  - Unauthenticated users → `/auth/login`
  - Authenticated users → `/(tabs)`

### 6. **Profile Screen** (`app/(tabs)/profile.tsx`)
User management screen with:
- Account information display
- Email verification status
- Password change functionality
- Theme toggle
- Sign out button

## How to Use

### Start the App
```bash
npm start
```

### First Time Setup
1. The app will redirect to the login screen
2. Click "Sign Up" to create a new account
3. Enter your email and password (min 8 characters)
4. Check your email for verification link (if email confirmation is enabled)
5. Sign in with your credentials

### Authentication Flow
- **Unauthenticated users**: Automatically redirected to login screen
- **Authenticated users**: Can access all tabs (Home, Explore, Profile)
- **Session persistence**: Auth tokens are securely stored and persist across app restarts

### Supabase Dashboard Setup

To enable full functionality, configure these settings in your Supabase dashboard:

1. **Authentication Settings** (Authentication → Settings)
   - Enable/disable email confirmation
   - Configure redirect URLs for password reset
   - Set up email templates

2. **Email Templates** (Authentication → Email Templates)
   - Customize confirmation email
   - Customize password reset email

3. **URL Configuration**
   Add these URLs to "Redirect URLs" in Supabase:
   ```
   zerotracelabsmobile://reset-password
   ```

### Security Features
- Auth tokens stored securely using `expo-secure-store` on native platforms
- Session auto-refresh enabled
- Password requirements enforced (minimum 8 characters)

## Key Files

```
├── lib/
│   ├── supabase.ts                    # Supabase client config
│   └── stores/
│       └── auth-store.ts              # Auth state management
├── components/
│   ├── auth/
│   │   └── protected-route.tsx        # Route protection
│   ├── providers/
│   │   └── auth-provider.tsx          # Auth initialization
│   └── screens/
│       ├── login-screen.tsx           # Login UI
│       ├── signup-screen.tsx          # Sign up UI
│       ├── forgot-password-screen.tsx # Password reset UI
│       └── profile-screen.tsx         # User profile UI
└── app/
    ├── _layout.tsx                    # Root layout with auth provider
    ├── auth/                          # Auth routes
    │   ├── login.tsx
    │   ├── signup.tsx
    │   └── forgot-password.tsx
    └── (tabs)/
        └── profile.tsx                # Profile tab

```

## Adding Auth to New Screens

To protect a screen/tab, it's already handled automatically by the `ProtectedRoute` wrapper in `app/_layout.tsx`. All screens under `(tabs)` are protected.

To access auth state in any component:

```typescript
import { useAuthStore } from '@/lib/stores/auth-store';

function MyComponent() {
  const { user, loading, signOut } = useAuthStore();

  return (
    <View>
      <Text>Welcome {user?.email}!</Text>
      <Button onPress={signOut}>Sign Out</Button>
    </View>
  );
}
```

## Database Integration

To use Supabase database features:

```typescript
import { supabase } from '@/lib/supabase';

// Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*');

// Insert data
const { error } = await supabase
  .from('your_table')
  .insert({ column: 'value' });
```

## Troubleshooting

### "Invalid API credentials"
- Check `.env` file has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after changing `.env`

### Email not sending
- Enable email confirmation in Supabase dashboard
- Check email template configuration
- For development, check Supabase logs for email delivery status

### Auth redirect not working
- Make sure `AuthProvider` and `ProtectedRoute` are in `app/_layout.tsx`
- Check console for any error messages

## Next Steps

1. **Customize email templates** in Supabase dashboard
2. **Add user profiles** table in Supabase for extended user data
3. **Implement social auth** (Google, Apple, etc.)
4. **Add two-factor authentication** for enhanced security
5. **Set up Row Level Security (RLS)** policies in Supabase for data access control
