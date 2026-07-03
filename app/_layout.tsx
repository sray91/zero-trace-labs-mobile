import '@/global.css';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { WelcomeGate } from '@/components/auth/welcome-gate';
import { AuthProvider } from '@/components/providers/auth-provider';
import { convex, ConvexProviderWithClerk, useAuth } from '@/lib/convex';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// Referenced here in app code (not just inside @clerk/clerk-expo) so Expo's
// EXPO_PUBLIC_* inlining bakes the value into the production bundle — node_modules
// reads of process.env are NOT inlined, which is why relying on Clerk's auto-read
// crashed release builds with "Missing publishable key".
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthProvider>
          <ProtectedRoute>
            <WelcomeGate>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#0C0E1A' },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="data-for-nerds" />
                <Stack.Screen name="how-it-works" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="onboarding-complete" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/signup" />
                <Stack.Screen name="auth/forgot-password" />
              </Stack>
            </WelcomeGate>
          </ProtectedRoute>
        </AuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C0E1A',
  },
});
