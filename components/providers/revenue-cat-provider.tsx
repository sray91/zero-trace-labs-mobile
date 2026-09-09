import { revenueCatService } from '@/lib/revenue-cat';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useRef, useState } from 'react';

/**
 * Configures the RevenueCat SDK and keeps it identified as the current Clerk user.
 *
 * Identity matters more than it looks: RevenueCat echoes the app user id back as
 * `event.app_user_id` on every webhook, and `convex/subscriptions.ts:51` resolves the
 * account by matching that against `users.clerkId`. If the SDK is configured anonymously
 * or with any other id, purchases succeed but never attach to an account.
 *
 * Must render inside ClerkProvider.
 */
export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const refreshEntitlement = useSubscriptionStore((s) => s.refreshEntitlement);
  const reset = useSubscriptionStore((s) => s.reset);
  const wasSignedIn = useRef(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    if (isSignedIn && userId) {
      wasSignedIn.current = true;
      (async () => {
        await revenueCatService.initialize(userId);
        if (cancelled) return;
        setConfigured(revenueCatService.isConfigured);
        await refreshEntitlement();
      })();
    } else if (wasSignedIn.current) {
      // Only tear down on an actual sign-out, not on the initial signed-out render —
      // otherwise we'd clear the anonymous SDK state before it's even configured.
      wasSignedIn.current = false;
      reset();
      revenueCatService.logOut();
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, refreshEntitlement, reset]);

  // Renewals, expirations, and purchases made on the user's other devices arrive here
  // without any action in this app. Gated on `configured` because the SDK can't take a
  // listener before `configure()` has run.
  useEffect(() => {
    if (!configured || !isSignedIn) return;
    return revenueCatService.addCustomerInfoUpdateListener(() => {
      refreshEntitlement();
    });
  }, [configured, isSignedIn, refreshEntitlement]);

  return <>{children}</>;
}
