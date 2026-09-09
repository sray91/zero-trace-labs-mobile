import { RevenueCatPaywall } from '@/components/paywall/paywall';
import { revenueCatService } from '@/lib/revenue-cat';
import { useClerkAuth } from '@/lib/stores/auth-store';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/lib/legal';
import { COLOR } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const FEATURES = [
  'Continuous removals across 200+ data brokers',
  'Monthly re-scans — brokers relist, we take them down again',
  'Dark web exposure monitoring',
  'Priority human support',
];

/**
 * Subscription screen. `SubscriptionGate` redirects here for signed-in users without an
 * active plan.
 *
 * This screen is shown first: it spells out what the plan includes, the price of each
 * option, and the auto-renewal terms (App Review Guideline 3.1.2). "See plans" then opens
 * RevenueCat's hosted paywall for the actual purchase. The screen stays reachable if the
 * user dismisses the paywall — or if no Offering is configured yet — so a gated user
 * always has a route to Restore Purchases and Sign Out and is never stuck on a dead end.
 */
export default function PaywallScreen() {
  const [offeringState, setOfferingState] = useState<'checking' | 'ready' | 'unavailable'>(
    'checking'
  );
  const [showPaywall, setShowPaywall] = useState(false);
  const { signOut } = useClerkAuth();
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);
  const isRestoring = useSubscriptionStore((s) => s.isRestoring);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const offering = await revenueCatService.getOfferings();
      if (cancelled) return;
      setOfferingState(offering ? 'ready' : 'unavailable');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSuccess = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const handleRestore = useCallback(async () => {
    const restored = await restorePurchases();
    if (restored) {
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        'No purchases found',
        'We couldn’t find an active plan for this account. If you subscribed with a different Apple ID or Google account, sign in with that one and try again.'
      );
    }
  }, [restorePurchases]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace('/auth/login' as any);
  }, [signOut]);

  if (offeringState === 'checking') {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLOR.nuclearStart} />
      </View>
    );
  }

  if (showPaywall) {
    return (
      <RevenueCatPaywall
        onDismiss={() => setShowPaywall(false)}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.backgroundGlow}>
        <LinearGradient
          colors={['rgba(0,212,255,0.25)', 'transparent']}
          style={styles.backgroundGradient}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
            style={styles.ringOuter}
          >
            <View style={styles.ringInner}>
              <Ionicons name="shield-checkmark" size={44} color={COLOR.nuclearStart} />
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.title}>Keep your data off the web</Text>
        <Text style={styles.subtitle}>
          Removal isn’t one-and-done — brokers repost your records constantly. An active
          plan keeps us sweeping for you.
        </Text>

        <View style={styles.card}>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={COLOR.successStart} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceValue}>$14.99</Text>
            <Text style={styles.priceLabel}>per month</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceBlock}>
            <Text style={styles.priceValue}>$149.99</Text>
            <Text style={styles.priceLabel}>per year</Text>
            <Text style={styles.priceSaving}>Save 16%</Text>
          </View>
        </View>

        {offeringState === 'unavailable' ? (
          <View style={styles.noticeCard}>
            <Ionicons name="alert-circle" size={20} color={COLOR.warningEnd} />
            <Text style={styles.noticeText}>
              Plans aren’t available right now. Please try again shortly, or contact
              support if this keeps happening.
            </Text>
          </View>
        ) : (
          <Pressable style={styles.ctaWrap} onPress={() => setShowPaywall(true)}>
            <LinearGradient
              colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>SEE PLANS</Text>
            </LinearGradient>
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={handleRestore} disabled={isRestoring}>
          {isRestoring ? (
            <ActivityIndicator size="small" color={COLOR.nuclearStart} />
          ) : (
            <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.tertiaryButton}
          onPress={() => router.push('/support-chat' as any)}
        >
          <Text style={styles.tertiaryButtonText}>Contact Support</Text>
        </Pressable>

        <Pressable style={styles.tertiaryButton} onPress={handleSignOut}>
          <Text style={[styles.tertiaryButtonText, { color: COLOR.danger }]}>Sign Out</Text>
        </Pressable>

        <Text style={styles.legalText}>
          Auto-renewable subscription: $14.99 per month or $149.99 per year. Payment is charged
          to your Apple ID account at confirmation of purchase. The subscription renews
          automatically unless cancelled at least 24 hours before the end of the current
          period. Manage or cancel anytime in your App Store account settings.
        </Text>
        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL(TERMS_OF_USE_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.deepVoid,
  },
  safeArea: { flex: 1, backgroundColor: COLOR.deepVoid },
  backgroundGlow: { position: 'absolute', top: -120, left: -60, right: -60, height: 360 },
  backgroundGradient: { flex: 1, borderRadius: 999, opacity: 0.6 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48, alignItems: 'center' },
  iconWrap: { marginBottom: 24 },
  ringOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLOR.deepVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: COLOR.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: COLOR.textMuted,
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    width: '100%',
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    marginBottom: 20,
  },
  featureRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  featureText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLOR.white,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 28,
  },
  priceBlock: { flex: 1, alignItems: 'center' },
  priceDivider: { width: 1, height: 48, backgroundColor: COLOR.hairline },
  priceValue: { fontFamily: 'Outfit_700Bold', fontSize: 30, color: COLOR.white },
  priceLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: COLOR.textMuted, marginTop: 2 },
  priceSaving: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: COLOR.successStart,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  ctaWrap: { width: '100%' },
  cta: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#02101F',
    fontSize: 16,
    letterSpacing: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    width: '100%',
    backgroundColor: 'rgba(255, 159, 28, 0.08)',
    borderColor: 'rgba(255, 159, 28, 0.35)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: COLOR.textMuted,
  },
  secondaryButton: { marginTop: 20, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  secondaryButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: COLOR.nuclearStart,
  },
  tertiaryButton: { marginTop: 4, paddingVertical: 10 },
  tertiaryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLOR.textMuted,
  },
  legalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: COLOR.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  legalLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLOR.nuclearStart,
    textDecorationLine: 'underline',
  },
  legalDot: { color: COLOR.textMuted },
});
