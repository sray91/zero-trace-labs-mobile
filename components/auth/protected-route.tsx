import { useAuthStore } from '@/lib/stores/auth-store';
import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { initialized, isSignedIn } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/auth/login' as any);
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [isSignedIn, initialized, segments]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0C0E1A' }}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  return <>{children}</>;
}
