import { api } from '@/convex/_generated/api';
import { COLOR } from '@/lib/theme/colors';
import { useConvexAuth, useQuery } from 'convex/react';
import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Routes signed-in users who haven't finished onboarding to the Welcome flow.
 *
 * Mirrors the web gate (`app-zero-trace-labs/components/AppLayout.jsx`): reads
 * `api.users.getProfile` where `undefined` = loading, `null` = no profile yet, object =
 * profile exists. A user needs Welcome when they have no profile or `welcomeCompleted`
 * is false.
 *
 * Mobile is the regular-user experience, so (unlike web) there is no admin skip — the gate
 * keys purely on `welcomeCompleted`.
 */
export function WelcomeGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const segments = useSegments();

  // Don't query until Convex has an authenticated identity, and let the auth + welcome
  // routes render without gating (otherwise we'd redirect-loop or block sign-in).
  const inAuthGroup = segments[0] === 'auth';
  const onWelcome = segments[0] === 'welcome';
  const skipGate = !isAuthenticated || inAuthGroup || onWelcome;

  const profile = useQuery(api.users.getProfile, skipGate ? 'skip' : {});
  const needsWelcome =
    !skipGate && (profile === null || profile?.welcomeCompleted === false);

  useEffect(() => {
    if (needsWelcome) {
      router.replace('/welcome');
    }
  }, [needsWelcome]);

  // While we resolve the profile (or are mid-redirect), show a spinner instead of
  // briefly flashing the dashboard.
  if (!skipGate && (profile === undefined || needsWelcome)) {
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
