import { GlassCard, SectionTitle } from '@/components/dashboard/ui';
import { WorkingIndicator } from '@/components/dashboard/working-indicator';
import { api } from '@/convex/_generated/api';
import { ACCENT, AccentRole, COLOR, TIER_LABEL } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const StatCard = ({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  accent: AccentRole;
  icon: keyof typeof Ionicons.glyphMap;
}) => {
  const color = ACCENT[accent];
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 8 }} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
};

const ProgressBar = ({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) => (
  <View style={styles.progressBlock}>
    <View style={styles.progressLabelRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={[styles.progressPct, { color }]}>{pct}%</Text>
    </View>
    <View style={styles.progressTrack}>
      <View
        style={[styles.progressFill, { width: `${Math.min(100, pct)}%`, backgroundColor: color }]}
      />
    </View>
  </View>
);

export default function DashboardScreen() {
  const router = useRouter();
  const data = useQuery(api.dashboard.forCurrentUser);

  if (data === undefined) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLOR.nuclearStart} />
      </View>
    );
  }

  const { total, tierCounts, summary, completion, lastUpdated } = data;

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
        {/* 1. Header */}
        <Text style={styles.title}>Data Removal Progress</Text>
        <Text style={styles.subtitle}>
          Tracking {total} data brokers
          {lastUpdated ? ` · Last updated ${formatDate(lastUpdated)}` : ' · No activity yet'}
        </Text>

        {/* Subtle "background activity" heartbeat */}
        <WorkingIndicator />

        {/* 2. Summary stat cards */}
        <View style={styles.statGrid}>
          <StatCard
            label="Total Brokers"
            value={total}
            sub="In your tracker"
            accent="nuclear-blue"
            icon="shield-checkmark"
          />
          <StatCard
            label="Not Started"
            value={summary.notStarted}
            sub="Pending action"
            accent="muted-gray"
            icon="ellipse-outline"
          />
          <StatCard
            label="Opt-Outs Submitted"
            value={summary.submitted}
            sub="Awaiting confirmation"
            accent="warning-yellow"
            icon="time-outline"
          />
          <StatCard
            label="Confirmed Removed"
            value={summary.removed}
            sub="Verified clean"
            accent="success-green"
            icon="checkmark-circle"
          />
        </View>

        {/* 3. Overall completion */}
        <GlassCard>
          <SectionTitle>Overall Completion Rate</SectionTitle>
          <ProgressBar
            label="Confirmed removed"
            pct={completion.removedPct}
            color={COLOR.successStart}
          />
          <ProgressBar
            label="Opt-outs submitted"
            pct={completion.submittedPct}
            color={COLOR.warningEnd}
          />
          <ProgressBar
            label="Not yet started"
            pct={completion.notStartedPct}
            color={COLOR.textMuted}
          />
        </GlassCard>

        {/* 4. Tier counts */}
        <View style={styles.tierRow}>
          {[1, 2, 3].map((tier) => (
            <View key={tier} style={styles.tierCard}>
              <Text style={styles.tierValue}>{tierCounts[tier as 1 | 2 | 3] ?? 0}</Text>
              <Text style={styles.tierLabel}>{TIER_LABEL[tier]}</Text>
            </View>
          ))}
        </View>

        {/* 5. How the removal process works (click-through explainer) */}
        <Pressable
          onPress={() => router.push('/how-it-works' as any)}
          style={({ pressed }) => [styles.nerdCard, styles.linkSpacing, pressed && styles.nerdCardPressed]}
        >
          <View style={styles.nerdIconWrap}>
            <Ionicons name="help-buoy" size={20} color={COLOR.nuclearStart} />
          </View>
          <View style={styles.nerdTextWrap}>
            <Text style={styles.nerdTitle}>How it works</Text>
            <Text style={styles.nerdSub}>
              A quick walkthrough of how we remove your data — and why it takes time
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLOR.textMuted} />
        </Pressable>

        {/* 6. Detailed breakdowns live on the "Data for Nerds" page */}
        <Pressable
          onPress={() => router.push('/data-for-nerds' as any)}
          style={({ pressed }) => [styles.nerdCard, styles.linkSpacing, pressed && styles.nerdCardPressed]}
        >
          <View style={styles.nerdIconWrap}>
            <Ionicons name="analytics" size={20} color={COLOR.nuclearStart} />
          </View>
          <View style={styles.nerdTextWrap}>
            <Text style={styles.nerdTitle}>Data for Nerds</Text>
            <Text style={styles.nerdSub}>
              Full breakdown by tier & category, plus the Tier 1 broker list
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLOR.textMuted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOR.deepVoid },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.deepVoid,
  },
  backgroundGlow: { position: 'absolute', top: -120, left: -60, right: -60, height: 360 },
  backgroundGradient: { flex: 1, borderRadius: 999, opacity: 0.6 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    color: COLOR.white,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLOR.textMuted,
    marginTop: 6,
    marginBottom: 14,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 30, marginBottom: 2 },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: COLOR.white,
    textAlign: 'center',
  },
  statSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLOR.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  progressBlock: { marginBottom: 16 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: COLOR.textMuted },
  progressPct: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: COLOR.trackBg,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 999 },
  tierRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  tierCard: {
    flex: 1,
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tierValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 22, color: COLOR.white },
  tierLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLOR.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  nerdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  nerdCardPressed: { opacity: 0.7 },
  linkSpacing: { marginBottom: 12 },
  nerdIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,212,255,0.1)',
    marginRight: 12,
  },
  nerdTextWrap: { flex: 1 },
  nerdTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: COLOR.white },
  nerdSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLOR.textMuted,
    marginTop: 2,
  },
});
