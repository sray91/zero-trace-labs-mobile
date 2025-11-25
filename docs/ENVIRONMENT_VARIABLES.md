# Environment Variables in Production

## Overview

Environment variables work differently in mobile apps compared to web apps. This guide explains how to manage them for 0Trace Labs Mobile.

## The Basics

### Development
- `.env` file is read by Expo CLI during development
- Changes require restarting the dev server (`npm start`)
- Never commit `.env` to git (already in `.gitignore`)

### Production
- `.env` files are **NOT included** in production builds
- Environment variables are **baked into the JavaScript bundle at build time**
- You must configure them in your build system

## The `EXPO_PUBLIC_` Prefix

Variables prefixed with `EXPO_PUBLIC_` are:
- ✅ Exposed to client-side JavaScript
- ✅ Safe for public APIs (like Supabase anon key)
- ⚠️ **NOT SECRET** - Anyone can extract them from your app

```bash
# ✅ GOOD - Public, client-safe keys
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ BAD - Never expose server secrets with EXPO_PUBLIC_
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_secret_key  # DON'T DO THIS!
EXPO_PUBLIC_STRIPE_SECRET_KEY=sk_live_xxx              # DON'T DO THIS!
```

## Production Deployment Options

### Option 1: EAS Build with Inline Env (Current Setup)

I've created `eas.json` with your environment variables embedded:

**Pros:**
- Simple to set up
- Works immediately
- No additional configuration needed

**Cons:**
- Variables are in version control
- Same values for all team members
- Harder to change per environment

**How to build:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build for both
eas build --platform all --profile production
```

### Option 2: EAS Secrets (Recommended for Teams)

Store secrets securely in EAS and reference them:

**Step 1: Store secrets in EAS**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_anon_key"
```

**Step 2: Update `eas.json` to reference secrets**
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
      }
    }
  }
}
```

**Pros:**
- Secrets not in version control
- Different values per environment
- Team members can have different configs
- More secure

**Cons:**
- Requires EAS account
- Slightly more complex setup

### Option 3: Different Environments

Create separate Supabase projects for dev/staging/production:

**Update `eas.json`:**
```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://dev-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "dev_key_here"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://staging-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "staging_key_here"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://prod-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "prod_key_here"
      }
    }
  }
}
```

**Build commands:**
```bash
eas build --profile development  # Uses dev Supabase
eas build --profile preview      # Uses staging Supabase
eas build --profile production   # Uses production Supabase
```

## Security Best Practices

### ✅ DO:
- Use Supabase Row Level Security (RLS) to protect data
- Use the **anon key** for client apps (it's designed to be public)
- Rotate keys if they're ever compromised
- Keep `.env` in `.gitignore`

### ❌ DON'T:
- Put service role keys in client apps
- Store payment processing secrets in the app
- Commit `.env` to version control
- Use `EXPO_PUBLIC_` for actual secrets

## Supabase Security

Your Supabase **anon key** is safe to expose because:
1. It's designed for client-side use
2. Supabase uses Row Level Security (RLS) policies to protect data
3. All requests are validated server-side

**Make sure you have RLS enabled on your tables:**
```sql
-- Example: Only users can read their own data
CREATE POLICY "Users can view own data"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Expo Updates (OTA Updates)

When using EAS Update for over-the-air updates:

```bash
# Publish an update
eas update --branch production --message "Fix login bug"
```

The environment variables from your build are preserved - you **cannot** change env vars via OTA updates. You must create a new build.

## Testing Your Build

### Local development build:
```bash
# Build development client
eas build --profile development --platform ios

# After installing, start the dev server
npx expo start --dev-client
```

### Test production config locally:
```bash
# Create a .env.production file
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod_key_here

# Load it temporarily
cp .env.production .env
npm start
```

## Troubleshooting

### "Environment variable not found"
- Make sure variable starts with `EXPO_PUBLIC_`
- Restart the dev server after changing `.env`
- Clear cache: `npx expo start --clear`

### "Different values in production"
- Check `eas.json` env values
- Run `eas secret:list` to see EAS secrets
- Verify build profile: `eas build:list`

### "Variables not updating"
- Environment variables are **baked in at build time**
- Must create new build to change them
- OTA updates don't change env vars

## Current Setup

Your app is configured with:
- ✅ `.env` for local development
- ✅ `eas.json` with production environment variables
- ✅ `.env.example` for team onboarding
- ✅ `.env` in `.gitignore`

## Next Steps

1. **For quick testing:** Use the current `eas.json` setup
2. **For production:** Consider using EAS Secrets
3. **For multiple environments:** Create separate Supabase projects
4. **Always:** Enable Row Level Security on your Supabase tables

## Resources

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
