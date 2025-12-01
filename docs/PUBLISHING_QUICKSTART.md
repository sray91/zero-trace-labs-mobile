# Publishing Quick Start - TL;DR

The fastest path from code to App Store. For complete details, see [docs/APP_STORE_PUBLISHING.md](./docs/APP_STORE_PUBLISHING.md)

## Prerequisites (Do Once)

### 1. Create Developer Accounts
- **Apple**: https://developer.apple.com/programs/ ($99/year)
- **Google**: https://play.google.com/console/signup ($25 one-time)

### 2. Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 3. Configure Your Project
```bash
# Get your EAS project ID
eas build:configure

# Update app.json line 66 with the project ID shown
```

---

## Required Before Publishing

### ✅ Must Have
1. **Privacy Policy** - Create and host online
   - Template: https://www.termsfeed.com/privacy-policy-generator/
   - Must explain data collection, usage, storage

2. **App Store Screenshots** (take using simulator/emulator)
   - **iOS**: 6.7" iPhone (1290x2796) - at least 3 screenshots
   - **Android**: Phone (1080x1920) - at least 2 screenshots

3. **Bundle Identifiers** (already in app.json)
   - iOS: `com.zerotrace.labs`
   - Android: `com.zerotrace.labs`
   - ⚠️ Change these NOW if you want different ones (can't change after submission)

4. **App Icon** - 1024x1024 PNG
   - Already at `./assets/images/icon.png`
   - Verify it's correct size and format

---

## Steps to Publish

### Step 1: Create App Listings

#### iOS (App Store Connect)
1. Go to https://appstoreconnect.apple.com/
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Name: 0Trace Labs
   - Bundle ID: com.zerotrace.labs
   - SKU: any unique ID
4. Complete:
   - App Privacy (data collection questionnaire)
   - Pricing: Free
   - Privacy Policy URL
   - Screenshots
   - Description

#### Android (Play Console)
1. Go to https://play.google.com/console/
2. Click **Create app**
3. Fill in:
   - Name: 0Trace Labs
   - Package: com.zerotrace.labs
4. Complete:
   - Store Listing (description, screenshots)
   - Data Safety (data collection form)
   - Content Rating (questionnaire)
   - Privacy Policy URL

### Step 2: Build & Submit

#### iOS
```bash
# Build and submit in one command
eas build --platform ios --auto-submit

# You'll be prompted for:
# - Apple ID
# - App-specific password (create at appleid.apple.com)
```

#### Android
```bash
# Build and submit in one command
eas build --platform android --auto-submit
```

#### Both Platforms
```bash
# Build and submit to both stores
eas build --platform all --auto-submit
```

### Step 3: Finalize in Store Consoles

#### iOS
1. Go to App Store Connect
2. Select your app → version
3. Select the build that was just uploaded
4. Add "What's New" release notes
5. Click **Submit for Review**

#### Android
1. Go to Play Console
2. Go to **Production** → **Create new release**
3. Release should be auto-created with your build
4. Add release notes
5. Click **Review release** → **Start rollout**

### Step 4: Wait for Approval

- **iOS**: 24-48 hours (usually)
- **Android**: 1-7 days (first submission longer)

---

## Common Issues

### Build Fails
**Check:**
- Environment variables in `eas.json`
- EAS project ID in `app.json` line 66
- Run `eas build:list` to see error logs

### Submission Rejected
**iOS common reasons:**
- Missing privacy policy
- Incomplete App Privacy section
- Crashes during review

**Android common reasons:**
- Incomplete Data Safety form
- Missing content rating
- Policy violations

**Fix:** Address the issue and resubmit. Second reviews are usually faster.

---

## After Launch

### Share Your App
```
iOS: https://apps.apple.com/app/idYOUR_APP_ID
Android: https://play.google.com/store/apps/details?id=com.zerotrace.labs
```

### Release Updates

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",
   "ios": { "buildNumber": "2" },
   "android": { "versionCode": 2 }
   ```

2. Build and submit:
   ```bash
   eas build --platform all --auto-submit
   ```

3. Add release notes in store consoles

### For Minor Fixes (OTA Updates)
```bash
# JavaScript-only changes, no native code
eas update --branch production --message "Fix login bug"
```

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer | $99 | Yearly |
| Google Play | $25 | One-time |
| **Total Year 1** | **$124** | - |
| **Ongoing** | **$99/year** | Apple renewal |

---

## Timeline

| Phase | Duration |
|-------|----------|
| Developer accounts | 1-2 days |
| Create assets & listings | 2-3 days |
| Build & submit | 1 day |
| iOS review | 1-2 days |
| Android review | 3-7 days |
| **Total** | **1-2 weeks** |

---

## Resources

- 📄 [Complete Publishing Guide](./docs/APP_STORE_PUBLISHING.md)
- ✅ [Detailed Checklist](./LAUNCH_CHECKLIST.md)
- 🔧 [EAS Build Guide](./README_EAS.md)
- 🔐 [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md)

---

## Need Help?

1. Check the [complete guide](./docs/APP_STORE_PUBLISHING.md)
2. Review [EAS documentation](https://docs.expo.dev/submit/introduction/)
3. Check store guidelines:
   - [Apple](https://developer.apple.com/app-store/review/guidelines/)
   - [Google](https://support.google.com/googleplay/android-developer/)

---

**Ready to launch?** Start with [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)! 🚀
