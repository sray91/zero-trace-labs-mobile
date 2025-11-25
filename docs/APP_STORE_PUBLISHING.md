# Publishing to App Stores - Complete Guide

This guide covers everything you need to publish 0Trace Labs Mobile to the Apple App Store and Google Play Store.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Pre-Launch Checklist](#pre-launch-checklist)
- [iOS App Store](#ios-app-store)
- [Google Play Store](#google-play-store)
- [Post-Submission](#post-submission)
- [Updates & Maintenance](#updates--maintenance)

---

## Prerequisites

### 1. Developer Accounts (Cost: $99/year iOS + $25 one-time Android)

#### Apple Developer Account
- **Cost**: $99/year
- **Sign up**: https://developer.apple.com/programs/
- **Processing time**: 24-48 hours
- **Requirements**:
  - Credit card
  - Two-factor authentication
  - D-U-N-S number (for companies)

#### Google Play Developer Account
- **Cost**: $25 one-time fee
- **Sign up**: https://play.google.com/console/signup
- **Processing time**: 24-48 hours
- **Requirements**:
  - Google account
  - Credit card
  - Government ID (for verification)

### 2. Required Tools

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Verify your project
eas whoami
```

### 3. Required Assets

You'll need these files (check `assets/images/`):
- ✅ **App Icon** (1024x1024 PNG) - `icon.png`
- ✅ **Splash Screen** - `splash-icon.png`
- ✅ **Android Adaptive Icon** - `android-icon-*.png`
- ⚠️ **App Store Screenshots** (various sizes)
- ⚠️ **Privacy Policy URL** (required)
- ⚠️ **App Description** (both stores)

---

## Pre-Launch Checklist

### Legal & Compliance

- [ ] **Privacy Policy** - Create and host online
  - Must explain: data collection, usage, sharing, user rights
  - Template: https://www.termsfeed.com/privacy-policy-generator/
  - Required for: Supabase auth, user data storage

- [ ] **Terms of Service** - Optional but recommended

- [ ] **App Store Content Rating**
  - Complete questionnaire about content
  - Age rating will be assigned automatically

- [ ] **Export Compliance**
  - Does your app use encryption? (Yes - Supabase uses HTTPS)
  - Self-classify as using standard encryption

### Technical Requirements

- [ ] **App Icon** - 1024x1024, no transparency, no rounded corners
- [ ] **Bundle Identifier** - Choose one (can't change later)
  - Format: `com.yourcompany.0tracelabs` or `com.0tracelabs.mobile`

- [ ] **Version Number** - Follow semantic versioning (1.0.0)

- [ ] **App Description** - Clear, compelling copy
  - Title (max 30 chars for iOS)
  - Subtitle (iOS only)
  - Description (4000 chars)
  - Keywords (iOS only)

- [ ] **Screenshots** - Required sizes:
  - **iOS**: 6.7" iPhone (1290x2796), 6.5" iPhone (1242x2688)
  - **Android**: Phone (1080x1920), 7" tablet, 10" tablet

- [ ] **App Category** - Choose appropriate category
  - Suggested: Lifestyle, Utilities, or Productivity

### Testing

- [ ] **Test on real devices** - iOS and Android
- [ ] **Test authentication flow** - Sign up, login, logout
- [ ] **Test all features** - Every screen and interaction
- [ ] **Test with slow network** - Verify loading states
- [ ] **Accessibility testing** - Screen readers, font scaling
- [ ] **Privacy compliance** - Ensure RLS is enabled in Supabase

---

## iOS App Store

### Step 1: Configure Your App

Update `app.json` with iOS-specific settings:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.0tracelabs.mobile",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSFaceIDUsageDescription": "We use Face ID for secure authentication",
        "NSCameraUsageDescription": "Camera access is needed for profile photos"
      }
    }
  }
}
```

### Step 2: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform**: iOS
   - **Name**: 0Trace Labs (or your preferred name)
   - **Primary Language**: English
   - **Bundle ID**: Select the one from app.json
   - **SKU**: Any unique ID (e.g., `0tracelabs-mobile-001`)
   - **User Access**: Full Access

### Step 3: Fill Out App Information

In App Store Connect, complete all required sections:

#### **App Information**
- Privacy Policy URL: `https://yourwebsite.com/privacy`
- Category: Choose primary and secondary
- Content Rights: Confirm you have rights to content

#### **Pricing and Availability**
- Price: Free (or set price)
- Availability: All countries or select specific ones

#### **App Privacy**
Click "Get Started" and answer questions about:
- Data collection (email, user ID from Supabase)
- Data usage (authentication, app functionality)
- Data linked to user (email, user ID)

### Step 4: Prepare Screenshots & Media

You need screenshots for:
- **6.7" Display** (iPhone 14 Pro Max): 1290 x 2796
- **6.5" Display** (iPhone 11 Pro Max): 1242 x 2688
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208 (optional)

**Quick way to generate:**
```bash
# Use iOS Simulator
npm start -- --ios

# In simulator:
# 1. Select iPhone 14 Pro Max
# 2. Navigate to each screen
# 3. Cmd+S to save screenshot
# 4. Resize if needed
```

Or use a design tool like Figma with device frames.

### Step 5: Build & Submit with EAS

```bash
# Build for production
eas build --platform ios --profile production

# When build completes, submit to App Store
eas submit --platform ios --profile production

# Or do both in one command
eas build --platform ios --auto-submit
```

You'll be prompted for:
- Apple ID
- App-specific password (create at appleid.apple.com)
- App Store Connect credentials

### Step 6: Complete App Store Listing

1. Go back to App Store Connect
2. Select your app → **Version**
3. Fill in:
   - **App Previews and Screenshots**: Upload screenshots
   - **Description**: Compelling app description
   - **Keywords**: Relevant search terms (max 100 chars)
   - **Support URL**: Your website or support page
   - **Marketing URL**: Optional

4. Add **What's New** (release notes)
5. Select **Build** that was uploaded via EAS
6. Complete **Age Rating** questionnaire
7. Click **"Submit for Review"**

### Step 7: Wait for Review

- **Review time**: 24-48 hours (sometimes faster)
- **Status updates**: Via email and App Store Connect
- **Common rejection reasons**:
  - Missing privacy policy
  - Crashes or bugs
  - Misleading screenshots
  - Incomplete app information

---

## Google Play Store

### Step 1: Configure Your App

Update `app.json` with Android-specific settings:

```json
{
  "expo": {
    "android": {
      "package": "com.zerotrace.labs",
      "versionCode": 1,
      "permissions": [],
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundColor": "#0C0E1A"
      }
    }
  }
}
```

### Step 2: Create App in Play Console

1. Go to https://play.google.com/console/
2. Click **"Create app"**
3. Fill in:
   - **App name**: 0Trace Labs
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free
   - Accept Developer Program Policies

### Step 3: Set Up Store Listing

Navigate to **Store presence** → **Main store listing**:

#### **App details**
- **App name**: 0Trace Labs (max 30 chars)
- **Short description**: One-line pitch (max 80 chars)
  - Example: "Erase your digital footprint with military-grade privacy protection"
- **Full description**: Detailed description (max 4000 chars)

#### **Graphics**
Required assets:
- **App icon**: 512 x 512 PNG (32-bit, no transparency)
- **Feature graphic**: 1024 x 500 PNG or JPG
- **Phone screenshots**: 2-8 images, min 320px, max 3840px
  - JPEG or PNG, 16:9 or 9:16 ratio
- **7" tablet screenshots**: Optional but recommended
- **10" tablet screenshots**: Optional

**Quick screenshot generation:**
```bash
# Use Android Emulator
npm start -- --android

# In emulator:
# 1. Use a Pixel 5 or similar
# 2. Navigate to each screen
# 3. Click camera icon in emulator toolbar
# 4. Screenshots saved to Screenshots folder
```

#### **Categorization**
- **App category**: Choose from dropdown (Lifestyle/Tools)
- **Tags**: Select relevant tags (max 5)
- **Contact details**:
  - Email
  - Phone (optional)
  - Website

#### **Privacy Policy**
- Enter your privacy policy URL

### Step 4: Content Rating

1. Go to **Policy** → **App content** → **Content rating**
2. Fill out questionnaire:
   - Violence, language, mature content, etc.
3. Get rating (will be EVERYONE, TEEN, etc.)

### Step 5: Data Safety

This is CRITICAL - explain what data you collect:

1. Go to **Policy** → **App content** → **Data safety**
2. Answer questions about data collection:

**Does your app collect data?** Yes
- Email address: Required for authentication
- User ID: Required for functionality
- Usage data: Optional (analytics if you use any)

**Is data encrypted in transit?** Yes

**Can users request data deletion?** Yes (via Supabase dashboard or add feature)

**Data collection purpose:**
- Account management
- App functionality
- Fraud prevention

### Step 6: App Access

1. Go to **Policy** → **App content** → **App access**
2. If you have restricted features:
   - Provide demo credentials
   - Or explain how to access
3. If all features are accessible: Select "All functionalities are available"

### Step 7: Build & Submit with EAS

```bash
# Build for production (creates AAB file)
eas build --platform android --profile production

# Download the AAB file or submit directly
eas submit --platform android --profile production

# Or do both in one command
eas build --platform android --auto-submit
```

**Note**: EAS builds an **AAB (Android App Bundle)**, which is required by Google Play.

### Step 8: Release Management

1. Go to **Release** → **Production**
2. Click **"Create new release"**
3. Upload the AAB file (if not using `eas submit`)
4. Add **Release notes** (what's new)
5. Set **Release name** (usually version number: 1.0.0)
6. Choose rollout:
   - **Full rollout**: 100% of users immediately
   - **Staged rollout**: Gradual (e.g., 20% → 50% → 100%)
7. Click **"Review release"**
8. Click **"Start rollout to Production"**

### Step 9: Wait for Review

- **Review time**: 1-7 days (often within 24 hours)
- **Status updates**: Via email and Play Console
- **Common rejection reasons**:
  - Missing privacy policy
  - Data safety section incomplete
  - Content rating not completed
  - Crashes during testing

---

## Post-Submission

### While Waiting for Approval

#### iOS
- Monitor email for updates
- Check App Store Connect for status changes
- Prepare promotional materials (website, social media)

#### Android
- First submission may take longer (3-7 days)
- Subsequent updates are usually faster (1-2 days)
- Google may request additional information

### If Rejected

1. **Read the rejection reason carefully**
2. **Common fixes**:
   - Add missing privacy policy link
   - Fix crashes (test on more devices)
   - Update screenshots to match actual app
   - Complete missing metadata
3. **Respond to reviewer** (iOS) or fix and resubmit
4. **Resubmit**: Usually reviewed faster the second time

### When Approved

#### Immediate Actions
- [ ] Test the live app download
- [ ] Verify all functionality works in production
- [ ] Share with beta testers
- [ ] Prepare marketing materials

#### Marketing
- [ ] Create App Store badge for website
- [ ] Share on social media
- [ ] Press release (optional)
- [ ] Product Hunt launch (optional)

---

## Updates & Maintenance

### Releasing Updates

1. **Update version** in `app.json`:
   ```json
   {
     "version": "1.0.1",  // User-facing version
     "ios": { "buildNumber": "2" },  // iOS build number
     "android": { "versionCode": 2 }  // Android version code
   }
   ```

2. **Build and submit**:
   ```bash
   eas build --platform all --auto-submit
   ```

3. **Add release notes** in store consoles

### OTA Updates (Minor Changes Only)

For JavaScript-only changes (no native code):

```bash
# Publish OTA update
eas update --branch production --message "Fix login bug"
```

**OTA updates**:
- ✅ Can update: UI, business logic, bug fixes
- ❌ Cannot update: Native dependencies, app.json changes
- Updates download automatically when users open the app

### Version Numbering

Follow semantic versioning:
- **1.0.0** → **1.0.1**: Bug fixes (patch)
- **1.0.0** → **1.1.0**: New features (minor)
- **1.0.0** → **2.0.0**: Breaking changes (major)

Always increment:
- iOS `buildNumber` with each submission
- Android `versionCode` with each submission

---

## Common Issues & Solutions

### Issue: "Build failed - Invalid Bundle Identifier"
**Solution**: Bundle ID in app.json must match App Store Connect

### Issue: "Missing compliance information"
**Solution**: Add export compliance to app.json:
```json
"ios": {
  "config": {
    "usesNonExemptEncryption": false
  }
}
```

### Issue: "App crashes on launch"
**Solution**:
- Test on real devices
- Check EAS build logs
- Verify all environment variables are set

### Issue: "Privacy policy required"
**Solution**:
- Create privacy policy page
- Host on your website
- Add URL to both store listings

### Issue: "Data safety violations"
**Solution**:
- Accurately describe all data collection
- Implement data deletion
- Use Supabase RLS policies

---

## Cost Summary

### One-Time Costs
- Apple Developer: $99/year
- Google Play: $25 one-time
- **Total first year**: $124

### Ongoing Costs
- Apple Developer: $99/year
- Supabase: Free tier or ~$25/month for Pro
- **Total yearly**: $99 + hosting

---

## Timeline

| Phase | Duration | Notes |
|-------|----------|-------|
| Developer account setup | 1-2 days | Apple slower than Google |
| App preparation | 1-2 weeks | Assets, testing, compliance |
| First submission | Same day | Using EAS |
| Review (iOS) | 1-2 days | Can be faster |
| Review (Android) | 3-7 days | First submission slower |
| **Total to launch** | **2-3 weeks** | If everything is ready |

---

## Resources

### Official Documentation
- [Expo EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

### Tools
- [Privacy Policy Generator](https://www.termsfeed.com/privacy-policy-generator/)
- [App Icon Generator](https://www.appicon.co/)
- [Screenshot Templates](https://www.figma.com/community/tag/app%20store%20screenshots/files)
- [App Store Screenshot Sizes](https://help.apple.com/app-store-connect/#/devd274dd925)

### EAS Commands Quick Reference
```bash
# Build
eas build --platform ios
eas build --platform android
eas build --platform all

# Submit
eas submit --platform ios
eas submit --platform android

# Combined
eas build --platform all --auto-submit

# Check build status
eas build:list

# Publish OTA update
eas update --branch production
```

---

## Next Steps

1. ✅ Review this guide completely
2. ⬜ Sign up for developer accounts
3. ⬜ Create privacy policy
4. ⬜ Generate screenshots
5. ⬜ Complete pre-launch checklist
6. ⬜ Update app.json with bundle IDs
7. ⬜ Build with EAS
8. ⬜ Submit to stores
9. ⬜ Wait for approval
10. ⬜ Launch! 🚀

Good luck with your launch! 🎉
