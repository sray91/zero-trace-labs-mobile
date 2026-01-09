import { useAuthStore } from '@/lib/stores/auth-store';
import { api, Subscription, useSubscriptionStore } from '@/lib/stores/subscription-store';
import { useQuery } from 'convex/react';
import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, initialized, isSignedIn } = useAuthStore();
  const { setSubscription, updateEntitlementStatus } = useSubscriptionStore();
  const segments = useSegments();

  // Convex reactive query - automatically updates when data changes
  const subscription = useQuery(
    api.subscriptions.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Sync subscription data to store when it changes
  useEffect(() => {
    if (subscription !== undefined) {
      setSubscription(subscription as Subscription | null);
    }
  }, [subscription, setSubscription]);

  // Update RevenueCat entitlement status when user is authenticated
  useEffect(() => {
    if (user?.id) {
      updateEntitlementStatus();
    }
  }, [user?.id, updateEntitlementStatus]);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isSignedIn && !inAuthGroup) {
      // Redirect to login if not authenticated and not already on an auth page
      router.replace('/auth/login' as any);
    } else if (isSignedIn && inAuthGroup) {
      // Redirect to tabs if authenticated and on an auth page
      router.replace('/(tabs)' as any);
    }
  }, [isSignedIn, initialized, segments]);

  // Show loading screen while checking auth
  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 dark:text-gray-400 mt-4">Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
