/**
 * Whop Integration Service
 *
 * This service handles Whop SDK integration for processing payments.
 * The actual subscription management is handled by webhooks on the webapp
 * which update the Supabase customers table.
 */

import { supabase } from './supabase';
import { useSubscriptionStore } from './stores/subscription-store';

export interface WhopPurchaseParams {
  planId: string;
  planName: string;
  userId: string;
  email: string;
  fullName?: string;
}

export interface WhopPurchaseResult {
  success: boolean;
  checkoutSessionId?: string;
  membershipId?: string;
  error?: string;
}

class WhopService {
  /**
   * Initiate a purchase flow with Whop
   *
   * Note: In React Native, you'll need to use Whop's mobile SDK
   * or redirect to a web checkout. This is a placeholder for the
   * actual implementation.
   */
  async initiatePurchase(params: WhopPurchaseParams): Promise<WhopPurchaseResult> {
    try {
      console.log('Initiating Whop purchase:', params);

      // Create checkout session via your webapp API
      // Your webapp will create a Whop checkout link with the correct plan
      const response = await fetch('https://app.0tracelabs.com/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: params.planId,
          user_id: params.userId,
          email: params.email,
          full_name: params.fullName || '',
          source: 'mobile_app',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create checkout session: ${error}`);
      }

      const data = await response.json();
      const checkoutUrl = data.checkout_url;

      if (!checkoutUrl) {
        throw new Error('No checkout URL returned from server');
      }

      // Open checkout in in-app browser
      const { WebBrowser } = await import('expo-web-browser');

      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: '#00D4FF',
        dismissButtonStyle: 'close',
      });

      console.log('Browser result:', result);

      // Return success - actual verification happens via webhook + polling
      return {
        success: true,
        checkoutSessionId: data.session_id,
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
   * Create a checkout session via your backend API
   * This assumes you have an API endpoint that creates Whop checkout sessions
   */
  async createCheckoutSession(params: WhopPurchaseParams): Promise<string> {
    try {
      // Call your webapp API to create a checkout session
      const response = await fetch('https://app.0tracelabs.com/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: params.planId,
          user_id: params.userId,
          email: params.email,
          full_name: params.fullName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data.checkout_url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  /**
   * Verify purchase completion by checking the customer record
   * This polls the database to see if the webhook has updated it
   */
  async verifyPurchase(userId: string, maxAttempts = 10): Promise<boolean> {
    const store = useSubscriptionStore.getState();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await store.fetchCustomer(userId);

      if (store.hasActiveSubscription()) {
        return true;
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return false;
  }

  /**
   * Check if user has an active Whop membership
   */
  async hasActiveMembership(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('subscription_status, has_app_access, access_expires_at')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      // Check multiple conditions for active access
      const hasAccess = data.has_app_access === true;
      const isActive = ['active', 'trialing'].includes(data.subscription_status);

      // Check expiration if set
      let notExpired = true;
      if (data.access_expires_at) {
        const expiresAt = new Date(data.access_expires_at);
        notExpired = new Date() <= expiresAt;
      }

      return hasAccess && isActive && notExpired;
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }
}

// Export singleton instance
export const whopService = new WhopService();

// Whop Plan IDs - these should match your Whop dashboard configuration
export const WHOP_PLANS = {
  FREE_TIER: process.env.EXPO_PUBLIC_WHOP_FREE_PLAN_ID || 'plan_free',
  BASIC: process.env.EXPO_PUBLIC_WHOP_BASIC_PLAN_ID || 'plan_basic',
  PREMIUM: process.env.EXPO_PUBLIC_WHOP_PREMIUM_PLAN_ID || 'plan_premium',
} as const;

// Plan metadata for display
export const PLAN_INFO = {
  [WHOP_PLANS.FREE_TIER]: {
    name: 'Free Trial',
    price: 'Free',
    cadence: 'Limited access',
    features: ['7-day trial', 'Basic scans', 'Limited removals'],
  },
  [WHOP_PLANS.BASIC]: {
    name: 'Basic',
    price: '$14.99/mo',
    cadence: 'Billed monthly',
    features: ['Monthly detonation sweeps', 'Standard broker blocking', 'Email support'],
  },
  [WHOP_PLANS.PREMIUM]: {
    name: 'Premium',
    price: '$29.99/mo',
    cadence: 'Billed monthly',
    features: ['On-demand wipes', 'Dark web surveillance', 'Priority response', '24/7 monitoring'],
  },
} as const;
