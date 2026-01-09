import { create } from 'zustand';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { revenueCatService } from '../revenue-cat';

export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export interface Subscription {
  _id: Id<"subscriptions">;
  userId: Id<"users">;
  clerkId: string;
  status: SubscriptionStatus;
  planId: string | null;
  planName: string | null;
  provider: string;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  hasAppAccess: boolean;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  createdAt: number;
  updatedAt: number;
}

interface SubscriptionState {
  subscription: Subscription | null;
  isEntitled: boolean; // RevenueCat entitlement status
  isLoading: boolean;
  error: string | null;

  // Actions
  setSubscription: (subscription: Subscription | null) => void;
  updateEntitlementStatus: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  hasActiveSubscription: () => boolean;
  reset: () => void;
}

/**
 * Subscription store that works with Convex reactive queries.
 * 
 * The subscription data is fetched via Convex's useQuery hook in components,
 * which automatically updates when data changes (no manual realtime subscription needed).
 * 
 * This store holds the subscription state and RevenueCat entitlement status.
 */
export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  isEntitled: false,
  isLoading: false,
  error: null,

  setSubscription: (subscription: Subscription | null) => {
    set({ subscription });
  },

  updateEntitlementStatus: async () => {
    try {
      const customerInfo = await revenueCatService.getCustomerInfo();
      const isEntitled = customerInfo
        ? revenueCatService.isEntitled(customerInfo)
        : false;
      set({ isEntitled });
    } catch (error) {
      console.error('Error updating entitlement status:', error);
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true });
    try {
      const customerInfo = await revenueCatService.restorePurchases();
      const isEntitled = customerInfo
        ? revenueCatService.isEntitled(customerInfo)
        : false;

      set({ isEntitled, isLoading: false });
    } catch (error) {
      console.error('Error restoring purchases:', error);
      set({
        error: 'Failed to restore purchases',
        isLoading: false
      });
    }
  },

  hasActiveSubscription: () => {
    const { subscription, isEntitled } = get();

    // 1. Check RevenueCat Entitlement (Primary source of truth for mobile IAP)
    if (isEntitled) return true;

    // 2. Check Convex Subscription (Webhook-synced status)
    if (!subscription) return false;

    // Check if has app access
    if (!subscription.hasAppAccess) return false;

    // Check if subscription is active or trialing
    const validStatuses: SubscriptionStatus[] = ['active', 'trialing'];
    if (!validStatuses.includes(subscription.status)) return false;

    // Check if access hasn't expired
    if (subscription.currentPeriodEnd) {
      const expiresAt = new Date(subscription.currentPeriodEnd);
      const now = new Date();
      if (now > expiresAt) return false;
    }

    return true;
  },

  reset: () => {
    set({
      subscription: null,
      isEntitled: false,
      isLoading: false,
      error: null,
    });
  },
}));

// Export the Convex query for use in components
export { api };
