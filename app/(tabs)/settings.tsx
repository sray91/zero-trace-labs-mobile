import { api } from '@/convex/_generated/api';
import { useClerkAuth } from '@/lib/stores/auth-store';
import { COLOR } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const GlassCard = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

export default function SettingsScreen() {
  const { signOut, user } = useClerkAuth();
  const profile = useQuery(api.users.getProfile);

  const email = user?.primaryEmailAddress?.emailAddress;
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const avatarChar = (fullName || email || 'U').charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login' as any);
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

        <Pressable style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.dangerButtonText}>SIGN OUT</Text>
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
  dangerButton: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLOR.danger,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: { fontFamily: 'Outfit_600SemiBold', color: COLOR.danger, letterSpacing: 1 },
  appInfo: { marginTop: 32, alignItems: 'center' },
  appInfoText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: COLOR.textMuted },
});
