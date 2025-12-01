import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface ScanEvent {
  name: string;
  detail: string;
  severity: Severity;
}

const COLOR = {
  deepVoid: '#0C0E1A',
  nuclearStart: '#00D4FF',
  successStart: '#3DD598',
  glassBorder: 'rgba(0, 212, 255, 0.35)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  textMuted: '#8B93B6',
};

const severityColors: Record<Severity, string> = {
  critical: '#FF5470',
  high: '#FFB347',
  medium: '#FFD670',
  low: '#3DD598',
  info: '#48C6EF',
};

const severityTitles: Record<Severity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFO',
};

const SCAN_EVENTS: ScanEvent[] = [
  { name: 'Acxiom', detail: 'Home Address, DOB', severity: 'critical' },
  { name: 'PeopleFinder', detail: 'Phone, Relatives', severity: 'high' },
  { name: 'Whitepages', detail: 'Full Name, IP', severity: 'medium' },
  { name: 'Spokeo', detail: 'Photos, Social Handles', severity: 'high' },
  { name: 'LexisNexis', detail: 'Financial Traces', severity: 'critical' },
];

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
}

const GlassCard = ({ children, style }: GlassCardProps) => (
  <View style={[styles.glassCard, styles.glassCardBody, style]}>{children}</View>
);

export default function AlertsScreen() {
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

        <Text style={styles.headline}>ALERTS</Text>
        <Text style={styles.subhead}>Security notifications and threats detected.</Text>

        <GlassCard style={styles.evidenceCard}>
          <Text style={styles.cardTitle}>Recent Alerts</Text>
          {SCAN_EVENTS.map((event, idx) => (
            <View key={`${event.name}-${idx}`} style={styles.evidenceRow}>
              <View style={[styles.streamIcon, { backgroundColor: `${severityColors[event.severity]}22` }]}>
                <Ionicons name="warning" size={18} color={severityColors[event.severity]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.evidenceTitle}>{event.name}</Text>
                <Text style={styles.evidenceDetail}>{event.detail}</Text>
              </View>
              <Text style={[styles.streamSeverity, { color: severityColors[event.severity] }]}>
                {severityTitles[event.severity]}
              </Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={styles.liveLogCard}>
          <Text style={styles.cardTitle}>Alert Settings</Text>
          <View style={styles.logRow}>
            <View style={[styles.logIcon, { backgroundColor: `${COLOR.successStart}22` }]}>
              <Ionicons name="notifications" size={16} color={COLOR.successStart} />
            </View>
            <Text style={styles.logText}>Push notifications enabled</Text>
          </View>
          <View style={styles.logRow}>
            <View style={[styles.logIcon, { backgroundColor: `${COLOR.nuclearStart}22` }]}>
              <Ionicons name="shield" size={16} color={COLOR.nuclearStart} />
            </View>
            <Text style={styles.logText}>Critical alerts only mode active</Text>
          </View>
        </GlassCard>
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
  headline: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 34,
    color: '#ffffff',
    lineHeight: 38,
    textTransform: 'uppercase',
  },
  subhead: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
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
  evidenceCard: {
    marginBottom: 24,
    gap: 16,
  },
  cardTitle: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceTitle: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
  },
  evidenceDetail: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 12,
  },
  streamSeverity: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
  liveLogCard: {
    gap: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logText: {
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    flex: 1,
    fontSize: 13,
  },
});
