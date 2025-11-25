import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, initialized } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not already on an auth page
      router.replace('/auth/login' as any);
    } else if (user && inAuthGroup) {
      // Redirect to tabs if authenticated and on an auth page
      router.replace('/(tabs)' as any);
    }
  }, [user, initialized, segments]);

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
