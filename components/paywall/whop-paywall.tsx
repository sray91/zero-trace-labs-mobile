import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Alert, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { whopService, WHOP_PLANS, PLAN_INFO } from '@/lib/whop';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';

interface WhopPaywallProps {
  onSuccess?: () => void;
  onDismiss?: () => void;
}

const COLOR = {
  deepVoid: '#0C0E1A',
  nuclearStart: '#00D4FF',
  nuclearEnd: '#006CFF',
  successStart: '#3DD598',
  warningEnd: '#FF9F1C',
  glassBorder: 'rgba(0, 212, 255, 0.35)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  textMuted: '#8B93B6',
};

type PlanKey = keyof typeof WHOP_PLANS;

/**
 * Whop-powered paywall component
 *
 * Opens web checkout and polls for subscription status
 */
export function WhopPaywall({ onSuccess, onDismiss }: WhopPaywallProps) {
  const { user } = useAuthStore();
  const { fetchCustomer, hasActiveSubscription } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('FREE_TIER');
  const [isLoading, setIsLoading] = useState(false);
  const [pollingForSubscription, setPollingForSubscription] = useState(false);

  const handlePurchase = async () => {
    if (!user?.id || !user?.email) {
      Alert.alert('Error', 'You must be logged in to subscribe');
      return;
    }

    setIsLoading(true);

    const planId = WHOP_PLANS[selectedPlan];

    try {
      // Open web checkout
      const result = await whopService.initiatePurchase({
        planId,
        planName: PLAN_INFO[planId].name,
        userId: user.id,
        email: user.email,
      });

      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }

      // Start polling for subscription status
      await pollForSubscription();

    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to start checkout'
      );
      setIsLoading(false);
    }
  };

  const pollForSubscription = async () => {
    if (!user?.id) return;

    setIsLoading(false);
    setPollingForSubscription(true);

    let attempts = 0;
    const maxAttempts = 20; // 40 seconds total (20 attempts * 2 seconds)

    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`Polling for subscription (${attempts}/${maxAttempts})`);

      await fetchCustomer(user.id);

      if (hasActiveSubscription()) {
        clearInterval(pollInterval);
        setPollingForSubscription(false);

        Alert.alert(
          'Success! 🎉',
          'Your subscription is now active!',
          [{ text: 'Continue', onPress: () => onSuccess?.() }]
        );
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setPollingForSubscription(false);

        Alert.alert(
          'Processing...',
          'Your payment is being processed. You should have access within a few minutes.',
          [{ text: 'OK', onPress: () => onDismiss?.() }]
        );
      }
    }, 2000);
  };

  if (pollingForSubscription) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-6">
        <ActivityIndicator size="large" color={COLOR.nuclearStart} />
        <Text className="text-white text-lg font-semibold mt-4">
          Activating Your Subscription...
        </Text>
        <Text className="text-slate-400 text-center mt-2">
          Please wait while we confirm your payment
        </Text>
      </View>
    );
  }

  const plans: { key: PlanKey; color: string; ribbon?: string }[] = [
    { key: 'FREE_TIER', color: COLOR.successStart, ribbon: 'START HERE' },
    { key: 'BASIC', color: COLOR.nuclearStart },
    { key: 'PREMIUM', color: COLOR.warningEnd, ribbon: 'MOST POPULAR' },
  ];

  return (
    <View className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="items-center mb-8 mt-4">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${COLOR.nuclearStart}22` }}
          >
            <Ionicons name="shield-checkmark" size={40} color={COLOR.nuclearStart} />
          </View>
          <Text className="text-white text-3xl font-bold text-center">
            Choose Your Plan
          </Text>
          <Text className="text-slate-400 text-center mt-2">
            Erase your digital footprint and protect your privacy
          </Text>
        </View>

        {/* Plan Cards */}
        {plans.map(({ key, color, ribbon }) => {
          const planId = WHOP_PLANS[key];
          const info = PLAN_INFO[planId];
          const isSelected = selectedPlan === key;

          return (
            <Pressable
              key={key}
              onPress={() => setSelectedPlan(key)}
              className="mb-4"
            >
              <View
                className="rounded-2xl p-5 border-2"
                style={{
                  backgroundColor: isSelected ? `${color}11` : COLOR.glassBg,
                  borderColor: isSelected ? color : COLOR.glassBorder,
                }}
              >
                {ribbon && (
                  <View
                    className="absolute top-3 right-3 px-3 py-1 rounded-full"
                    style={{ backgroundColor: color }}
                  >
                    <Text className="text-slate-900 text-xs font-bold">
                      {ribbon}
                    </Text>
                  </View>
                )}

                <Text className="text-white text-xl font-bold mb-1">
                  {info.name}
                </Text>
                <Text className="text-2xl font-bold mb-1" style={{ color }}>
                  {info.price}
                </Text>
                <Text className="text-slate-400 text-sm mb-3">
                  {info.cadence}
                </Text>

                {info.features.map((feature, idx) => (
                  <View key={idx} className="flex-row items-center mb-2">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={color}
                    />
                    <Text className="text-slate-300 text-sm ml-2">
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}

        {/* Trust Badges */}
        <View className="flex-row justify-center gap-6 mt-6 mb-4">
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
      </ScrollView>

      {/* Bottom Actions */}
      <View className="p-6 border-t border-slate-800">
        <Pressable
          onPress={handlePurchase}
          disabled={isLoading}
          className="w-full mb-3"
        >
          <LinearGradient
            colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl py-4 items-center"
          >
            {isLoading ? (
              <ActivityIndicator color="#02101F" />
            ) : (
              <Text className="text-slate-900 font-bold text-lg">
                {selectedPlan === 'FREE_TIER' ? 'START FREE TRIAL' : 'SUBSCRIBE NOW'}
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onDismiss} className="items-center">
          <Text className="text-slate-500 text-sm">Maybe later</Text>
        </Pressable>
      </View>
    </View>
  );
}
