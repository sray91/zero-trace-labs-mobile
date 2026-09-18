import { api } from '@/convex/_generated/api';
import { AI_PRODUCT, AI_PROVIDER } from '@/lib/legal';
import { revenueCatService } from '@/lib/revenue-cat';
import { useClerkAuth } from '@/lib/stores/auth-store';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { COLOR } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

/** Where the OS lets a user cancel or switch plans — Apple and Google both require
 *  that a paid app link users here rather than handling cancellation in-app. */
const MANAGE_SUBSCRIPTION_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

const GlassCard = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

export default function SettingsScreen() {
  const { signOut, user } = useClerkAuth();
  const profile = useQuery(api.users.getProfile);
  const entitlement = useQuery(api.subscriptions.getEntitlement);
  const aiConsent = useQuery(api.support.aiConsent);
  const setAiConsent = useMutation(api.support.setAiConsent);
  const isEntitled = useSubscriptionStore((s) => s.isEntitled);
  const isRestoring = useSubscriptionStore((s) => s.isRestoring);
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);

  const email = user?.primaryEmailAddress?.emailAddress;
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const avatarChar = (fullName || email || 'U').charAt(0).toUpperCase();

  const isPaid = entitlement?.isPaid === true || isEntitled;
  const planLabel = entitlement?.isPaid ? entitlement.planLabel : isEntitled ? 'Premium' : 'Free';
  const renewsOn = entitlement?.currentPeriodEnd
    ? new Date(entitlement.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Withdrawing takes effect immediately: convex/support.ts stops calling the AI
  // service and moves any open conversation to a human.
  const handleAiConsentChange = async (granted: boolean) => {
    try {
      await setAiConsent({ granted });
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login' as any);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account, profile, and removal history. Any active subscription must be cancelled separately in your App Store settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setIsDeleting(true);
            try {
              // Deleting the Clerk user fires the user.deleted webhook, which removes
              // the Convex user + profile (convex/users.ts deleteFromClerk).
              await user.delete();
              await revenueCatService.logOut().catch(() => {});
              router.replace('/auth/login' as any);
            } catch (err: any) {
              Alert.alert(
                'Couldn’t delete account',
                err?.errors?.[0]?.longMessage ??
                  err?.message ??
                  'Please try again or contact support.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? 'Purchases restored' : 'No purchases found',
      restored
        ? 'Your plan is active on this device.'
        : 'We couldn’t find an active plan for this account. If you subscribed with a different Apple ID or Google account, sign in with that one and try again.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View pointerEvents="none" style={styles.backgroundGlow}>
        <LinearGradient
          colors={['rgba(0,212,255,0.25)', 'transparent']}
          style={styles.backgroundGradient}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/0tracelabs-logo-dark.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Account */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{avatarChar}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{fullName || 'Your Account'}</Text>
              <Text style={styles.profileEmail}>{email || 'No email'}</Text>
            </View>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Active</Text>
              <Text style={styles.statLabel}>Account Status</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
        </GlassCard>

        {/* Subscription */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name={isPaid ? 'shield-checkmark' : 'lock-closed'}
              size={22}
              color={isPaid ? COLOR.successStart : COLOR.warningEnd}
            />
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{planLabel}</Text>
              <Text style={styles.infoBody}>
                {isPaid
                  ? renewsOn
                    ? `Your plan renews on ${renewsOn}.`
                    : 'Your plan is active.'
                  : 'Subscribe for $14.99/month or $149.99/year to keep removals running.'}
              </Text>
            </View>
          </View>

          <View style={styles.planActions}>
            {isPaid ? (
              <Pressable
                style={styles.planButton}
                onPress={() => Linking.openURL(MANAGE_SUBSCRIPTION_URL)}
              >
                <Text style={styles.planButtonText}>Manage Subscription</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.planButton} onPress={() => router.push('/paywall')}>
                <Text style={styles.planButtonText}>View Plans</Text>
              </Pressable>
            )}

            <Pressable style={styles.planButton} onPress={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <ActivityIndicator size="small" color={COLOR.nuclearStart} />
              ) : (
                <Text style={styles.planButtonText}>Restore Purchases</Text>
              )}
            </Pressable>
          </View>
        </GlassCard>

        {/* Removal service info — read-only model */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={22} color={COLOR.nuclearStart} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Managed Removals</Text>
              <Text style={styles.infoBody}>
                Our team submits and tracks your data broker removals. Follow your progress on
                the Dashboard.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Support chat */}
        <Pressable onPress={() => router.push('/support-chat' as any)}>
          <GlassCard style={styles.supportCard}>
            <View style={styles.infoRow}>
              <Ionicons name="chatbubbles" size={22} color={COLOR.nuclearStart} />
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>Chat with Support</Text>
                <Text style={styles.infoBody}>
                  Ask us anything about 0TraceLabs — our assistant answers instantly, or talk
                  to a human.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLOR.textMuted} />
            </View>
          </GlassCard>
        </Pressable>

        {/* AI assistant consent — App Store Guidelines 5.1.1(i) / 5.1.2(i). */}
        <GlassCard style={styles.supportCard}>
          <View style={styles.infoRow}>
            <Ionicons name="sparkles" size={22} color={COLOR.nuclearStart} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>AI support assistant</Text>
              <Text style={styles.infoBody}>
                When this is on, the messages you type in the Support chat are sent to{' '}
                {AI_PRODUCT}, an AI service operated by {AI_PROVIDER}, to generate a reply.
                Your name, address, scan results and payment details are never sent. Turn it
                off and your messages go only to our support team.
              </Text>
            </View>
            <Switch
              value={aiConsent?.state === 'granted'}
              onValueChange={handleAiConsentChange}
              disabled={aiConsent === undefined}
              trackColor={{ false: COLOR.glassBorder, true: COLOR.nuclearStart }}
              thumbColor={COLOR.white}
              accessibilityLabel="Allow the AI support assistant"
            />
          </View>
        </GlassCard>

        <Pressable style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.dangerButtonText}>SIGN OUT</Text>
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLOR.danger} />
          ) : (
            <Text style={styles.deleteButtonText}>Delete account</Text>
          )}
        </Pressable>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>ZeroTrace Labs v1.7.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOR.deepVoid },
  backgroundGlow: { position: 'absolute', top: -120, left: -60, right: -60, height: 360 },
  backgroundGradient: { flex: 1, borderRadius: 999, opacity: 0.6 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 },
  header: { marginBottom: 20 },
  logoImage: { height: 32, width: 120 },
  glassCard: {
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  profileCard: { marginBottom: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLOR.nuclearStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Outfit_600SemiBold', fontSize: 24, color: COLOR.deepVoid },
  profileInfo: { flex: 1 },
  profileName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: COLOR.white,
    marginBottom: 4,
  },
  profileEmail: { fontFamily: 'Inter_400Regular', fontSize: 13, color: COLOR.textMuted },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: COLOR.hairline },
  statValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: COLOR.white,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLOR.textMuted,
    textAlign: 'center',
  },
  infoCard: { marginBottom: 16 },
  supportCard: { marginBottom: 24 },
  infoRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  infoCopy: { flex: 1 },
  infoTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: COLOR.white,
    marginBottom: 4,
  },
  infoBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: COLOR.textMuted },
  planActions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  planButton: { minHeight: 28, justifyContent: 'center' },
  planButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: COLOR.nuclearStart,
  },
  dangerButton: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLOR.danger,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: { fontFamily: 'Outfit_600SemiBold', color: COLOR.danger, letterSpacing: 1 },
  deleteButton: { marginTop: 12, paddingVertical: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLOR.textMuted,
    textDecorationLine: 'underline',
  },
  appInfo: { marginTop: 32, alignItems: 'center' },
  appInfoText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: COLOR.textMuted },
});
