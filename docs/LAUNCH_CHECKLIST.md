# App Store Launch Checklist

Use this checklist to ensure you're ready to publish 0Trace Labs to the App Store and Google Play Store.

## ⚙️ Configuration (Complete Before Building)

### App Configuration
- [ ] Update `app.json`:
  - [ ] Verify `bundleIdentifier` for iOS (line 17)
  - [ ] Verify `package` for Android (line 29)
  - [ ] Update `projectId` in `extra.eas` section (line 66)
  - [ ] Confirm app name: "0Trace Labs" (line 3)
  - [ ] Verify version: "1.0.0" (line 5)

### EAS Configuration
- [ ] Run `eas build:configure` to get project ID
- [ ] Update `app.json` with the project ID
- [ ] Verify `eas.json` has correct environment variables

### Bundle Identifiers
Current settings in `app.json`:
- **iOS**: `com.zerotrace.labs`
- **Android**: `com.zerotrace.labs`

⚠️ **IMPORTANT**: Once you submit to stores, you cannot change these!

To customize:
1. Open `app.json`
2. Change line 17: `"bundleIdentifier": "com.yourcompany.appname"`
3. Change line 29: `"package": "com.yourcompany.appname"`

---

## 📱 Required Assets

### App Icon (1024x1024)
- [ ] Icon is exactly 1024x1024 pixels
- [ ] PNG format, 24-bit color
- [ ] No transparency
- [ ] No rounded corners (stores add them)
- [ ] File location: `./assets/images/icon.png`

### Screenshots
- [ ] **iOS Screenshots** (required):
  - [ ] iPhone 6.7" (1290 x 2796) - at least 3 screenshots
  - [ ] iPhone 6.5" (1242 x 2688) - at least 3 screenshots

- [ ] **Android Screenshots** (required):
  - [ ] Phone (min 320px, recommended 1080x1920) - at least 2 screenshots
  - [ ] 7" Tablet (optional but recommended)
  - [ ] 10" Tablet (optional but recommended)

**Suggested Screenshots to Capture:**
1. Welcome/Login screen
2. Dashboard with metrics
3. Scan/Results screen
4. Settings screen
5. Key feature highlight

### Other Graphics
- [ ] **Android Feature Graphic**: 1024 x 500 PNG/JPG
- [ ] **Splash Screen**: Located at `./assets/images/splash-icon.png`

---

## 📄 Legal & Compliance

### Privacy Policy
- [ ] Privacy policy created and hosted online
- [ ] URL is publicly accessible
- [ ] Covers:
  - [ ] Data collection (email, user data)
  - [ ] How data is used (authentication, app functionality)
  - [ ] Data storage (Supabase)
  - [ ] User rights (access, deletion)
  - [ ] Contact information

**Required because you use:**
- ✅ Email authentication (Supabase)
- ✅ User accounts and data storage
- ✅ Third-party services (Supabase)

**Free Privacy Policy Generators:**
- https://www.termsfeed.com/privacy-policy-generator/
- https://www.privacypolicygenerator.info/

### Terms of Service (Optional)
- [ ] Terms created and hosted (recommended but not required)
- [ ] URL is publicly accessible

### Export Compliance
- [x] Configured in app.json (line 24-26)
- [x] Using standard encryption only (HTTPS)

---

## 🏪 Store Listings

### iOS App Store

#### Required Information
- [ ] **App Name**: 0Trace Labs (or your choice, max 30 chars)
- [ ] **Subtitle**: One-line description (max 30 chars)
  - Example: "Military-grade privacy protection"
- [ ] **Privacy Policy URL**: `https://yourwebsite.com/privacy`
- [ ] **Support URL**: Your website or support email
- [ ] **Marketing URL**: Optional website
- [ ] **Description**: Compelling app description (max 4000 chars)
- [ ] **Keywords**: Comma-separated (max 100 chars total)
  - Example: "privacy,security,data,protection,delete,anonymous"
- [ ] **App Category**: Primary and secondary
  - Suggested: Lifestyle, Utilities, or Productivity
- [ ] **Content Rights**: Confirmation you own content

#### App Privacy (Required by Apple)
- [ ] Complete App Privacy questionnaire in App Store Connect
- [ ] Declare data collection:
  - [ ] Email addresses (required for authentication)
  - [ ] User ID (required for functionality)
  - [ ] Usage data (if you add analytics)
- [ ] Specify data is linked to user identity
- [ ] Confirm data is encrypted in transit

#### Age Rating
- [ ] Complete questionnaire
- [ ] Expected rating: 4+ or 9+ (no mature content)

### Google Play Store

#### Required Information
- [ ] **App Name**: 0Trace Labs (max 30 chars)
- [ ] **Short Description**: One-line pitch (max 80 chars)
  - Example: "Erase your digital footprint with military-grade privacy protection"
- [ ] **Full Description**: Detailed description (max 4000 chars)
- [ ] **App Category**: Choose from dropdown
  - Suggested: Lifestyle or Tools
- [ ] **Contact Email**: Required
- [ ] **Privacy Policy URL**: Required
- [ ] **Website**: Optional but recommended
- [ ] **Phone Number**: Optional

#### Data Safety (Required by Google)
- [ ] Complete Data Safety form in Play Console:
  - [ ] Does app collect data? **Yes**
  - [ ] Types collected:
    - [ ] Email address (required)
    - [ ] User ID (required)
  - [ ] Is data encrypted in transit? **Yes**
  - [ ] Can users request deletion? **Yes**
  - [ ] Data shared with third parties? **No** (unless using analytics)
  - [ ] Collection purposes:
    - [ ] Account management
    - [ ] App functionality
    - [ ] Fraud prevention

#### Content Rating
- [ ] Complete IARC questionnaire
- [ ] Answer questions about violence, language, etc.
- [ ] Expected rating: EVERYONE or EVERYONE 10+

#### App Access
- [ ] Specify if all features are accessible or if login required
- [ ] Provide demo credentials if needed

---

## 🧪 Testing

### Device Testing
- [ ] Test on real iOS device (not just simulator)
- [ ] Test on real Android device (not just emulator)
- [ ] Test on tablet (iPad and Android tablet)

### Functionality Testing
- [ ] **Authentication Flow**:
  - [ ] Sign up with email
  - [ ] Email verification works
  - [ ] Login works
  - [ ] Logout works
  - [ ] Password reset works

- [ ] **All Screens**:
  - [ ] Welcome screen
  - [ ] Scan/Results screens
  - [ ] Dashboard
  - [ ] Settings
  - [ ] All navigation works

- [ ] **Edge Cases**:
  - [ ] Slow/no internet connection
  - [ ] Invalid credentials
  - [ ] Session expiration
  - [ ] Backgrounding and resuming app

### Performance Testing
- [ ] App loads in < 3 seconds
- [ ] No crashes during normal use
- [ ] No memory leaks
- [ ] Smooth animations

### Accessibility
- [ ] VoiceOver/TalkBack works
- [ ] Text scales properly
- [ ] Sufficient color contrast
- [ ] Interactive elements have proper labels

### Security & Privacy
- [ ] Supabase Row Level Security (RLS) is enabled
- [ ] User data is properly protected
- [ ] No sensitive data logged to console
- [ ] HTTPS only (no HTTP requests)

---

## 🔧 Technical Setup

### Developer Accounts
- [ ] **Apple Developer Account** ($99/year)
  - [ ] Account created at https://developer.apple.com/
  - [ ] Two-factor authentication enabled
  - [ ] Payment method added

- [ ] **Google Play Developer Account** ($25 one-time)
  - [ ] Account created at https://play.google.com/console/
  - [ ] Identity verified
  - [ ] Payment processed

### Development Tools
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login`
- [ ] Project initialized: `eas build:configure`

### Supabase Setup
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Authentication providers configured
- [ ] Email templates customized (optional)
- [ ] Production database ready

---

## 🚀 Build & Submit

### Pre-Build Checklist
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Version numbers are correct
- [ ] Environment variables configured in `eas.json`
- [ ] Bundle identifiers match store listings

### iOS Build & Submit
```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store (after build completes)
eas submit --platform ios

# Or do both at once
eas build --platform ios --auto-submit
```

- [ ] Build started successfully
- [ ] Build completed without errors
- [ ] Submitted to App Store Connect
- [ ] Build appears in App Store Connect
- [ ] Build selected for app version
- [ ] App submitted for review

### Android Build & Submit
```bash
# Build for Android (creates AAB)
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android

# Or do both at once
eas build --platform android --auto-submit
```

- [ ] Build started successfully
- [ ] Build completed without errors (AAB format)
- [ ] Submitted to Google Play Console
- [ ] Release created in Play Console
- [ ] Release reviewed and started rollout

---

## 📧 Post-Submission

### iOS Review Process
- [ ] Submitted for review
- [ ] Status: "Waiting for Review"
- [ ] Status: "In Review"
- [ ] Status: "Pending Developer Release" or "Ready for Sale"

**If Rejected:**
- [ ] Read rejection reason carefully
- [ ] Fix issues mentioned
- [ ] Respond to App Review team if needed
- [ ] Resubmit

### Android Review Process
- [ ] Release created
- [ ] Status: "Under review"
- [ ] Status: "Publishing" or "Published"

**If Rejected:**
- [ ] Read policy violation details
- [ ] Fix issues mentioned
- [ ] Update and resubmit

### Launch Preparation
- [ ] App is live on App Store
- [ ] App is live on Google Play Store
- [ ] Tested download and installation
- [ ] All features work in production
- [ ] Monitoring setup (crash reporting, analytics)

---

## 🎯 Marketing & Launch

### Pre-Launch
- [ ] Website updated with app store badges
- [ ] Social media posts prepared
- [ ] Email announcement drafted
- [ ] Press kit prepared (optional)

### Launch Day
- [ ] Social media announcement
- [ ] Email to subscribers
- [ ] Product Hunt launch (optional)
- [ ] Hacker News post (optional)
- [ ] Submit to app directories

### Post-Launch
- [ ] Monitor reviews and ratings
- [ ] Respond to user feedback
- [ ] Track analytics
- [ ] Plan first update

---

## 📊 Monitoring

### App Performance
- [ ] Set up crash reporting (Sentry, Bugsnag, or EAS Insights)
- [ ] Set up analytics (if desired)
- [ ] Monitor app performance metrics

### User Feedback
- [ ] Monitor App Store reviews
- [ ] Monitor Google Play reviews
- [ ] Respond to user reviews
- [ ] Create feedback collection system

### App Store Metrics
- [ ] Check download numbers
- [ ] Monitor retention rates
- [ ] Track user engagement
- [ ] Analyze conversion funnel

---

## 🔄 Future Updates

### Version Update Process
1. Update version in `app.json`:
   - `"version": "1.0.1"`
   - `"buildNumber": "2"` (iOS)
   - `"versionCode": 2` (Android)
2. Build: `eas build --platform all --profile production`
3. Submit: `eas submit --platform all`
4. Add release notes in store consoles

### OTA Updates (JavaScript Only)
For minor fixes without native code changes:
```bash
eas update --branch production --message "Fix login bug"
```

---

## 🆘 Common Issues

### "Build failed"
- Check EAS build logs
- Verify all dependencies are installed
- Ensure environment variables are set
- Test local build: `eas build --local`

### "Invalid bundle identifier"
- Must match exactly between app.json and App Store Connect
- Cannot contain spaces or special characters
- Format: `com.company.appname`

### "Missing privacy policy"
- Must be publicly accessible URL
- Cannot be PDF download
- Must be specific to your app

### "Data safety violations"
- Accurately describe ALL data collection
- Don't forget third-party SDKs (Supabase, analytics)
- Explain how data is used

---

## ✅ Final Checks

Before submitting:
- [ ] I have tested the app thoroughly
- [ ] All required assets are uploaded
- [ ] Privacy policy is live and linked
- [ ] App store listings are complete
- [ ] Developer accounts are active
- [ ] I have read the app store guidelines
- [ ] Build completed successfully
- [ ] I am ready to launch! 🚀

---

## 📚 Resources

- [Complete Publishing Guide](./docs/APP_STORE_PUBLISHING.md)
- [Environment Variables Guide](./docs/ENVIRONMENT_VARIABLES.md)
- [EAS Quick Start](./README_EAS.md)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://support.google.com/googleplay/android-developer/answer/9859751)

---

**Estimated Time to Launch**: 2-3 weeks
- Account setup: 1-2 days
- Preparation: 1-2 weeks
- Review process: 1-7 days

Good luck with your launch! 🎉
