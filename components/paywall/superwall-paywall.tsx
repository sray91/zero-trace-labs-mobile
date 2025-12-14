import { useAuthStore } from '@/lib/stores/auth-store';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { superwallService } from '@/lib/superwall';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';

// Only import Superwall on native platforms
const Superwall = Platform.OS !== 'web'
  ? require('@superwall/react-native-superwall').default
  : null;

interface SuperwallPaywallProps {
  placement?: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
}

const COLOR = {
  deepVoid: '#0C0E1A',
  nuclearStart: '#00D4FF',
  nuclearEnd: '#006CFF',
  glassBorder: 'rgba(0, 212, 255, 0.35)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  textMuted: '#8B93B6',
};

/**
 * Superwall-powered paywall component
 *
 * This component triggers a Superwall paywall and handles the purchase flow.
 * The actual payment processing is done through Whop, which sends webhooks
 * to your backend to update the Supabase customers table.
 */
export function SuperwallPaywall({
  placement = 'app_launch',
  onSuccess,
  onDismiss,
}: SuperwallPaywallProps) {
  const { user } = useAuthStore();
  const { fetchCustomer, hasActiveSubscription } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [pollingForSubscription, setPollingForSubscription] = useState(false);

  useEffect(() => {
    // Superwall is only available on native platforms
    if (Platform.OS === 'web' || !Superwall) return;

    // Set up Superwall event listeners
    const setupListeners = async () => {
      // Listen for paywall events
      Superwall.shared.delegate = {
        // Called when user completes a purchase
        handleSuperwallEvent: async (event: { type: string }) => {
          console.log('Superwall event:', event);

          if (event.type === 'transaction_complete') {
            // Purchase completed, start polling for subscription status
            await handlePurchaseComplete();
          } else if (event.type === 'paywall_decline') {
            // User dismissed without purchasing
            onDismiss?.();
          }
        },

        // Called when purchase flow fails
        handlePurchaseError: (error: { message?: string }) => {
          console.error('Purchase error:', error);
          Alert.alert(
            'Purchase Failed',
            error.message || 'An error occurred during purchase. Please try again.'
          );
          setIsLoading(false);
          setPollingForSubscription(false);
        },
      };
    };

    setupListeners();
  }, [user?.id, onSuccess, onDismiss]);

  const handlePurchaseComplete = async () => {
    if (!user?.id) return;

    setPollingForSubscription(true);

    // Poll the database for subscription status
    // The webhook should update the customers table within a few seconds
    const maxAttempts = 15; // 30 seconds total (15 attempts * 2 seconds)

    const poll = async (attempt: number) => {
      console.log(`Polling for subscription status (attempt ${attempt}/${maxAttempts})`);

      await fetchCustomer(user.id);

      if (hasActiveSubscription()) {
        setPollingForSubscription(false);
        setIsLoading(false);

        Alert.alert(
          'Success! 🎉',
          'Your subscription is now active. Welcome to 0Trace Labs!',
          [{ text: 'Continue', onPress: () => onSuccess?.() }]
        );
      } else if (attempt >= maxAttempts) {
        setPollingForSubscription(false);
        setIsLoading(false);

        Alert.alert(
          'Processing Payment',
          'Your payment is being processed. You should have access within a few minutes. Please check back shortly.',
          [{ text: 'OK', onPress: () => onDismiss?.() }]
        );
      } else {
        // Schedule next poll only after current fetch completes
        setTimeout(() => poll(attempt + 1), 2000);
      }
    };

    // Start polling
    poll(1);
  };

  const presentPaywall = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to subscribe');
      return;
    }

    setIsLoading(true);

    try {
      // Register the event that triggers the paywall
      await superwallService.presentPaywall(placement, {
        user_id: user.id,
        user_email: user.email,
      });
    } catch (error) {
      console.error('Error presenting paywall:', error);
      Alert.alert(
        'Error',
        'Failed to load paywall. Please try again.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
    }
  };

  if (pollingForSubscription) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-6">
        <View className="items-center">
          <ActivityIndicator size="large" color={COLOR.nuclearStart} />
          <Text className="text-white text-lg font-semibold mt-4">
            Activating Your Subscription...
          </Text>
          <Text className="text-slate-400 text-center mt-2">
            This should only take a few seconds
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <View className="flex-1 items-center justify-center p-6">
        {/* Icon */}
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: `${COLOR.nuclearStart}22` }}
        >
          <Ionicons name="shield-checkmark" size={48} color={COLOR.nuclearStart} />
        </View>

        {/* Heading */}
        <Text className="text-white text-3xl font-bold text-center mb-2">
          Choose Your Plan
        </Text>
        <Text className="text-slate-400 text-center mb-8 text-base">
          Erase your digital footprint and protect your privacy
        </Text>

        {/* CTA Button */}
        <Pressable
          onPress={presentPaywall}
          disabled={isLoading}
          className="w-full"
        >
          <LinearGradient
            colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl py-4 px-6 items-center"
          >
            {isLoading ? (
              <ActivityIndicator color="#02101F" />
            ) : (
              <Text className="text-slate-900 font-bold text-lg">
                VIEW PRICING OPTIONS
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Trust indicators */}
        <View className="flex-row gap-6 mt-8">
          <View className="items-center">
            <Ionicons name="lock-closed" size={20} color={COLOR.nuclearStart} />
            <Text className="text-slate-400 text-xs mt-1">Encrypted</Text>
          </View>
          <View className="items-center">
            <Ionicons name="shield-checkmark" size={20} color={COLOR.nuclearStart} />
            <Text className="text-slate-400 text-xs mt-1">Secure</Text>
          </View>
          <View className="items-center">
            <Ionicons name="checkmark-circle" size={20} color={COLOR.nuclearStart} />
            <Text className="text-slate-400 text-xs mt-1">No Logs</Text>
          </View>
        </View>

        {/* Skip for now link (optional) */}
        <Pressable onPress={onDismiss} className="mt-6">
          <Text className="text-slate-500 text-sm">Maybe later</Text>
        </Pressable>
      </View>
    </View>
  );
}
