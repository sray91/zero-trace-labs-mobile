import { create } from 'zustand';
import { revenueCatService } from '../revenue-cat';

/**
 * Shape returned by `api.subscriptions.getEntitlement` (convex/subscriptions.ts).
 * This is the webhook-synced, server-side record — read it with Convex's `useQuery`,
 * which is already reactive, so it updates on its own when the webhook fires.
 */
export interface Entitlement {
  plan: string;
  planLabel: string;
  isPaid: boolean;
  status?: string;
  currentPeriodEnd?: number | null;
}

interface SubscriptionState {
  /** RevenueCat's local entitlement check — instant, survives webhook lag. */
  isEntitled: boolean;
  /** False until the first RevenueCat check completes, so gates can avoid flashing. */
  isEntitlementResolved: boolean;
  isRestoring: boolean;
  error: string | null;

  refreshEntitlement: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  reset: () => void;
}

/**
 * Holds the *device-local* RevenueCat entitlement only.
 *
 * The server-side subscription record deliberately does not live here — it comes from
 * `useQuery(api.subscriptions.getEntitlement)`, which is already reactive. Access checks
 * combine the two; see `components/auth/subscription-gate.tsx`.
 */
export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isEntitled: false,
  isEntitlementResolved: false,
  isRestoring: false,
  error: null,

  refreshEntitlement: async () => {
    try {
      const customerInfo = await revenueCatService.getCustomerInfo();
      set({
        isEntitled: customerInfo ? revenueCatService.isEntitled(customerInfo) : false,
        isEntitlementResolved: true,
      });
    } catch (error) {
      console.error('Error refreshing entitlement:', error);
      set({ isEntitlementResolved: true });
    }
  },

  restorePurchases: async () => {
    set({ isRestoring: true, error: null });
    try {
      const customerInfo = await revenueCatService.restorePurchases();
      const isEntitled = customerInfo ? revenueCatService.isEntitled(customerInfo) : false;
      set({ isEntitled, isEntitlementResolved: true, isRestoring: false });
      return isEntitled;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      set({ error: 'Failed to restore purchases', isRestoring: false });
      return false;
    }
  },

  reset: () => {
    set({
      isEntitled: false,
      isEntitlementResolved: false,
      isRestoring: false,
      error: null,
    });
  },
}));
