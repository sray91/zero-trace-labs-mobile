# EAS Build Quick Start

This project is configured to build production apps using EAS (Expo Application Services).

## First Time Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account (create one at expo.dev if needed)
eas login

# Configure your project (if not already done)
eas build:configure
```

## Building for Production

### iOS Build
```bash
eas build --platform ios --profile production
```

### Android Build
```bash
eas build --platform android --profile production
```

### Both Platforms
```bash
eas build --platform all --profile production
```

## Build Profiles

- **development** - Development client with debugging tools
- **preview** - Internal testing build
- **production** - Production release build

## Environment Variables

Environment variables are configured in `eas.json`. See `docs/ENVIRONMENT_VARIABLES.md` for detailed information.

### Current Configuration
- Variables are embedded directly in `eas.json`
- Same values used for all profiles
- Safe to commit (only contains public Supabase anon key)

### Upgrade to EAS Secrets (Recommended)
```bash
# Store secrets securely
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_key"
```

Then update `eas.json` to reference them:
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
}
```

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Environment Variables Guide](./docs/ENVIRONMENT_VARIABLES.md)
- [Expo Dashboard](https://expo.dev/)
