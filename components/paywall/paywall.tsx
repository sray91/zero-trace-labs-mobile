import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import React from 'react';
import { View } from 'react-native';
import Paywall from 'react-native-purchases-ui';

interface PaywallProps {
    onDismiss: () => void;
    onSuccess?: () => void;
}

export function RevenueCatPaywall({ onDismiss, onSuccess }: PaywallProps) {
    const { updateEntitlementStatus } = useSubscriptionStore();

    return (
        <View style={{ flex: 1 }}>
            <Paywall
                onDismiss={onDismiss}
                onPurchaseCompleted={async ({ customerInfo }) => {
                    console.log('Purchase completed:', customerInfo);
                    await updateEntitlementStatus();
                    if (onSuccess) onSuccess();
                }}
                onRestoreCompleted={async ({ customerInfo }) => {
                    console.log('Restore completed:', customerInfo);
                    await updateEntitlementStatus();
                }}
            />
        </View>
    );
}
