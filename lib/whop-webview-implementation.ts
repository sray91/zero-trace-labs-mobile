/**
 * OPTION A: WebView Checkout Implementation
 *
 * This is the SIMPLER approach - just opens your webapp's checkout page.
 * Use this if you already have a working checkout on app.0tracelabs.com
 *
 * INSTRUCTIONS:
 * 1. Copy the implementation below
 * 2. Replace the initiatePurchase function in lib/whop.ts
 * 3. Test it!
 */

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// Replace the initiatePurchase function with this:
async initiatePurchase(params: WhopPurchaseParams): Promise<WhopPurchaseResult> {
  try {
    console.log('Initiating Whop purchase via web:', params);

    // Build checkout URL with query parameters
    const checkoutUrl = `https://app.0tracelabs.com/checkout?` +
      `plan=${params.planId}` +
      `&email=${encodeURIComponent(params.email)}` +
      `&userId=${params.userId}` +
      `&source=mobile`;

    // Option A1: Open in in-app browser (recommended)
    const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: '#00D4FF',
    });

    // Option A2: Open in system browser (alternative)
    // await Linking.openURL(checkoutUrl);

    // Return success - actual verification happens via polling
    return {
      success: true,
    };

  } catch (error) {
    console.error('Whop purchase failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Purchase failed',
    };
  }
}

/**
 * WHAT THIS DOES:
 *
 * 1. Builds a URL to your webapp checkout page
 * 2. Opens it in an in-app browser (or system browser)
 * 3. User completes payment on your webapp
 * 4. Webhook fires → Updates Supabase
 * 5. Mobile app detects subscription via polling
 *
 * PROS:
 * ✅ Simple - uses your existing webapp
 * ✅ Works immediately
 * ✅ No new code on webapp needed
 * ✅ Leverages existing payment flow
 *
 * CONS:
 * ❌ Not as seamless (leaves the app)
 * ❌ User has to log in on web
 *
 * SETUP REQUIRED:
 * 1. Make sure your webapp has a checkout page at /checkout
 * 2. Accept query params: plan, email, userId
 * 3. After payment, redirect back to app (optional)
 */
