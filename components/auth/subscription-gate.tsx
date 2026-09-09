import { api } from '@/convex/_generated/api';
import { revenueCatService } from '@/lib/revenue-cat';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { COLOR } from '@/lib/theme/colors';
import { useConvexAuth, useQuery } from 'convex/react';
import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Routes signed-in users without an active plan to the paywall.
 *
 * Renders inside `WelcomeGate`, so by this point the user is authenticated and has
 * finished onboarding. Two independent sources are consulted:
 *
 *   1. RevenueCat (device-local) — instant after a purchase, no webhook round-trip.
 *   2. Convex `getEntitlement` (server) — the webhook-synced record of truth, and the
 *      only source that works if the purchase was made on the web or another device.
 *
 * Either one saying "paid" grants access.
 *
 * Fail-open: if RevenueCat was never configured — missing API keys, or Expo web, where
 * there is no StoreKit/Play Billing — the gate does not block. Without that, a build
 * shipped before the dashboard setup is finished would lock every user out of the app.
 */

/** Routes reachable without a plan. Users must always be able to reach support, and the
 *  paywall screen itself owns Restore Purchases + Sign Out so nobody gets trapped. */
const UNGATED_SEGMENTS = new Set([
  'auth',
  'welcome',
  'onboarding-complete',
  'paywall',
  'support-chat',
]);

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const segments = useSegments();
  const isEntitled = useSubscriptionStore((s) => s.isEntitled);
  const isEntitlementResolved = useSubscriptionStore((s) => s.isEntitlementResolved);

  const skipGate = !isAuthenticated || UNGATED_SEGMENTS.has(segments[0] ?? '');

  const entitlement = useQuery(api.subscriptions.getEntitlement, skipGate ? 'skip' : {});

  // Wait for both sources before deciding, otherwise a paying user gets bounced to the
  // paywall for a frame on every cold start.
  const isResolving = !skipGate && (entitlement === undefined || !isEntitlementResolved);

  const hasAccess =
    entitlement?.isPaid === true ||
    isEntitled ||
    // Subscriptions not wired up in this build — don't strand anyone.
    !revenueCatService.isConfigured;

  const needsPaywall = !skipGate && !isResolving && !hasAccess;

  useEffect(() => {
    if (needsPaywall) {
      router.replace('/paywall');
    }
  }, [needsPaywall]);

  if (!skipGate && (isResolving || needsPaywall)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLOR.deepVoid,
        }}
      >
        <ActivityIndicator size="large" color={COLOR.nuclearStart} />
      </View>
    );
  }

  return <>{children}</>;
}
