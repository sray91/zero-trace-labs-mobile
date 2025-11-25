# ⚠️ Important: Bundle Identifier Configuration

## Current Configuration

Your `app.json` has been configured with these bundle identifiers:

- **iOS Bundle Identifier**: `com.zerotrace.labs`
- **Android Package Name**: `com.zerotrace.labs`

## Why This Matters

**Bundle identifiers are permanent** - once you submit your app to the stores, you **CANNOT** change them. They uniquely identify your app forever.

## Should You Change Them?

### ✅ Keep Current Identifiers If:
- You're happy with `com.zerotrace.labs`
- You own the domain `zerotrace.com` or `0tracelabs.com`
- You want to launch quickly

### 🔄 Change Identifiers If:
- You want to use your own company name
- You have a different domain
- You prefer a different naming scheme

## How to Change (Do This NOW)

**⏰ CHANGE BEFORE YOUR FIRST BUILD**

Edit `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",  // Line 17
      // ...
    },
    "android": {
      "package": "com.yourcompany.yourapp",  // Line 29
      // ...
    }
  }
}
```

### Naming Rules

✅ **Valid**:
- `com.yourcompany.appname`
- `com.yourname.appname`
- `io.yourcompany.appname`
- `app.yourcompany.name`

❌ **Invalid**:
- Spaces: `com.your company.app`
- Special chars: `com.your-company.app!`
- Capital letters: `com.YourCompany.App`
- Numbers at start: `com.123company.app`

### Recommendations

**Best Practice**: Use reverse domain notation
- If you own `mycompany.com`, use `com.mycompany.appname`
- If you own `myapp.io`, use `io.myapp.mobile`

**Common Patterns**:
```
com.companyname.appname
com.yourname.appname
io.appname.mobile
app.appname.ios
app.appname.android
```

## iOS vs Android - Keep Them the Same

While iOS and Android use different terms:
- iOS: "Bundle Identifier"
- Android: "Package Name"

**Recommendation**: Use the **exact same** identifier for both platforms.

```json
{
  "ios": {
    "bundleIdentifier": "com.zerotrace.labs"
  },
  "android": {
    "package": "com.zerotrace.labs"
  }
}
```

This makes your app consistent and easier to manage.

## After Changing

1. Update `app.json` (lines 17 and 29)
2. Run `eas build:configure` again if needed
3. **DO NOT** build until you're 100% sure
4. Verify the identifier in both App Store Connect and Play Console matches exactly

## Can I Use Multiple Bundle IDs?

Yes, for different apps:
- Production: `com.company.app`
- Beta/Staging: `com.company.app.beta`
- Development: `com.company.app.dev`

But each needs separate App Store listings.

## What Happens If I Change After Submission?

You can't change it. You would need to:
1. Create a new app with new bundle ID
2. Lose all reviews, ratings, download stats
3. Users would have to download a new app
4. Lose app store ranking

**That's why you must choose carefully NOW!**

## Current Setup

The current bundle ID `com.zerotrace.labs` is configured and ready to use. If you're happy with it, you can proceed to building and publishing.

If you want to change it, **do it now** before your first build.

## Verification Checklist

Before building, verify:
- [ ] Bundle identifier follows naming rules
- [ ] You own the domain (or it's your name)
- [ ] Same identifier used for iOS and Android
- [ ] No typos in `app.json`
- [ ] Identifier matches your branding

## Questions?

If you're unsure what to use:
1. Use your company/personal domain in reverse: `com.yourdomain.appname`
2. If no domain, use your name: `com.yourname.appname`
3. Keep it simple and professional

Need to change it? Edit `app.json` lines 17 and 29 **now**, before your first build.

---

**Current Status**: Using `com.zerotrace.labs` for both platforms
**Action Required**: Review and change if needed, then proceed with [PUBLISHING_QUICKSTART.md](../PUBLISHING_QUICKSTART.md)
