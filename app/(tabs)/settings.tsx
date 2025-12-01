import { useAuthStore } from '@/lib/stores/auth-store';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';

const COLOR = {
  deepVoid: '#0C0E1A',
  nuclearStart: '#00D4FF',
  nuclearEnd: '#006CFF',
  warningEnd: '#FF9F1C',
  successStart: '#3DD598',
  glassBorder: 'rgba(0, 212, 255, 0.35)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  textMuted: '#8B93B6',
};

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
}

const GlassCard = ({ children, style }: GlassCardProps) => (
  <View style={[styles.glassCard, styles.glassCardBody, style]}>{children}</View>
);

export default function SettingsScreen() {
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [autoWipeEnabled, setAutoWipeEnabled] = useState(true);
  const [stealthAlerts, setStealthAlerts] = useState(true);
  const { signOut, user } = useAuthStore();

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/0tracelabs-logo-dark.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
              <Text style={styles.profileId}>ID: {user?.id?.slice(0, 8) || 'N/A'}</Text>
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
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Secure Settings</Text>
        <Text style={styles.subhead}>Tune detonation policy, notifications, and monitoring cadence.</Text>

        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Live Monitoring</Text>
              <Text style={styles.settingDetail}>24/7 data broker sweeps.</Text>
            </View>
            <Switch
              value={monitoringEnabled}
              onValueChange={setMonitoringEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: COLOR.nuclearEnd }}
              thumbColor={monitoringEnabled ? '#ffffff' : '#6B7280'}
              ios_backgroundColor="rgba(255,255,255,0.2)"
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Auto Wipe</Text>
              <Text style={styles.settingDetail}>Instant detonation when new traces appear.</Text>
            </View>
            <Switch
              value={autoWipeEnabled}
              onValueChange={setAutoWipeEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: COLOR.warningEnd }}
              thumbColor={autoWipeEnabled ? '#ffffff' : '#6B7280'}
              ios_backgroundColor="rgba(255,255,255,0.2)"
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Stealth Alerts</Text>
              <Text style={styles.settingDetail}>Only notify on critical broker events.</Text>
            </View>
            <Switch
              value={stealthAlerts}
              onValueChange={setStealthAlerts}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: COLOR.successStart }}
              thumbColor={stealthAlerts ? '#ffffff' : '#6B7280'}
              ios_backgroundColor="rgba(255,255,255,0.2)"
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.logsCard}>
          <Text style={styles.cardTitle}>Detonation Logs</Text>
          <View style={styles.logRow}>
            <Text style={styles.logText}>342 Records nuked • Last detonation: 12m ago</Text>
          </View>
          <View style={styles.logRow}>
            <Text style={styles.logText}>Monitoring cadence: 15 min</Text>
          </View>
        </GlassCard>

        <Pressable style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.dangerButtonText}>SIGN OUT</Text>
        </Pressable>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>ZeroTrace Labs v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR.deepVoid,
  },
  backgroundGlow: {
    position: 'absolute',
    top: -120,
    left: -60,
    right: -60,
    height: 360,
  },
  backgroundGradient: {
    flex: 1,
    borderRadius: 999,
    opacity: 0.6,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  logoImage: {
    height: 32,
    width: 120,
  },
  profileCard: {
    marginBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLOR.nuclearStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 24,
    color: COLOR.deepVoid,
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  profileId: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLOR.textMuted,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLOR.textMuted,
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 14,
    marginBottom: 16,
  },
  subhead: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  glassCard: {
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 24,
  },
  glassCardBody: {
    padding: 20,
  },
  settingsCard: {
    gap: 20,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
  },
  settingDetail: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  logsCard: {
    gap: 8,
    marginBottom: 24,
  },
  cardTitle: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  logRow: {
    paddingVertical: 4,
  },
  logText: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 13,
  },
  dangerButton: {
    marginTop: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FF5470',
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF5470',
    letterSpacing: 1,
  },
  appInfo: {
    marginTop: 32,
    alignItems: 'center',
  },
  appInfoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLOR.textMuted,
  },
});
