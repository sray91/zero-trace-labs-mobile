import { revenueCatService } from '@/lib/revenue-cat';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import React from 'react';
import RevenueCatUI from 'react-native-purchases-ui';

interface PaywallProps {
    onDismiss: () => void;
    onSuccess?: () => void;
}

/**
 * Thin wrapper over RevenueCat's hosted paywall.
 *
 * The layout, copy, and pricing shown here come from the Paywall you build in the
 * RevenueCat dashboard against the current Offering — none of it is defined in this repo.
 * If no Offering/Paywall is configured this renders blank, so `app/paywall.tsx` checks
 * for an offering first and shows its own fallback instead.
 */
export function RevenueCatPaywall({ onDismiss, onSuccess }: PaywallProps) {
    const refreshEntitlement = useSubscriptionStore((s) => s.refreshEntitlement);

    return (
        <RevenueCatUI.Paywall
            style={{ flex: 1 }}
            onDismiss={onDismiss}
            onPurchaseCompleted={async () => {
                await refreshEntitlement();
                onSuccess?.();
            }}
            onPurchaseError={async ({ error }) => {
                // App Review hit this: StoreKit completed the charge, then the receipt
                // post to RevenueCat failed ("Error 10: A network error has occurred"),
                // so the paywall reported failure even though the subscription existed.
                // Re-sync the App Store receipt and let the user through if it comes back
                // entitled. RevenueCat's own alert has already told the user what happened,
                // so there's nothing extra to show if this doesn't recover.
                if (error.userCancelled) return;
                console.warn('RevenueCat purchase error', error.code, error.message);
                const customerInfo = await revenueCatService.restorePurchases();
                await refreshEntitlement();
                if (customerInfo && revenueCatService.isEntitled(customerInfo)) {
                    onSuccess?.();
                }
            }}
            onRestoreCompleted={async ({ customerInfo }) => {
                await refreshEntitlement();
                // Restore fires even when there was nothing to restore — only advance if
                // the account actually came back entitled.
                if (revenueCatService.isEntitled(customerInfo)) {
                    onSuccess?.();
                }
            }}
        />
    );
}
