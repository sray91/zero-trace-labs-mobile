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

const COLOR = {
  deepVoid: '#0C0E1A',
  nuclearStart: '#00D4FF',
  nuclearEnd: '#006CFF',
  successStart: '#3DD598',
  successEnd: '#1EB980',
  glassBorder: 'rgba(0, 212, 255, 0.35)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  textMuted: '#8B93B6',
};

const BROKER_FINDINGS = [
  { name: 'Acxiom', detail: 'Contains: Home Address, DOB', type: 'Broker' },
  { name: 'PeopleFinder', detail: 'Contains: Phone, Relatives', type: 'Broker' },
  { name: 'Dark Web Exchange', detail: 'Contains: Credentials, IP', type: 'Dark Web' },
  { name: 'LexisNexis', detail: 'Contains: Financial Records', type: 'Broker' },
];

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
}

const GlassCard = ({ children, style }: GlassCardProps) => (
  <View style={[styles.glassCard, styles.glassCardBody, style]}>{children}</View>
);

export default function BrokersScreen() {
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

        <Text style={styles.headline}>BROKERS</Text>
        <Text style={styles.subhead}>Data brokers blocked and monitored.</Text>

        <GlassCard style={styles.evidenceCard}>
          <Text style={styles.cardTitle}>Blocked Brokers</Text>
          {BROKER_FINDINGS.map((broker) => (
            <View key={broker.name} style={styles.evidenceRow}>
              <View style={styles.evidenceIcon}>
                <Ionicons name="shield-checkmark" size={18} color="#3DD598" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.evidenceTitle}>{broker.name}</Text>
                <Text style={styles.evidenceDetail}>{broker.detail}</Text>
              </View>
              <Text style={[styles.evidenceBadge, { color: '#3DD598' }]}>BLOCKED</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={styles.liveLogCard}>
          <Text style={styles.cardTitle}>Monitoring Activity</Text>
          <View style={styles.logRow}>
            <View style={[styles.logIcon, { backgroundColor: `${COLOR.nuclearStart}22` }]}>
              <Ionicons name="eye" size={16} color={COLOR.nuclearStart} />
            </View>
            <Text style={styles.logText}>Scanning 512 brokers every hour</Text>
          </View>
          <View style={styles.logRow}>
            <View style={[styles.logIcon, { backgroundColor: `${COLOR.successStart}22` }]}>
              <Ionicons name="checkmark-circle" size={16} color={COLOR.successStart} />
            </View>
            <Text style={styles.logText}>Last scan: 2 minutes ago</Text>
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
  evidenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(61, 213, 152, 0.15)',
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
  evidenceBadge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
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
