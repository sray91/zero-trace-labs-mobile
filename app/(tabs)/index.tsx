import { api } from '@/convex/_generated/api';
import { ACCENT, AccentRole, COLOR, STATUS_LABEL, statusColor, TIER_LABEL } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
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

const GlassCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => <View style={[styles.glassCard, style]}>{children}</View>;

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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

export default function DashboardScreen() {
  const data = useQuery(api.dashboard.forCurrentUser);

  if (data === undefined) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLOR.nuclearStart} />
      </View>
    );
  }

  const { total, tierCounts, summary, completion, byTier, byCategory, tier1, lastUpdated } = data;

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

        {/* 5. Status breakdown by tier */}
        <GlassCard>
          <SectionTitle>Status Breakdown by Tier</SectionTitle>
          {byTier.map((row) => (
            <View key={row.tier} style={styles.breakdownBlock}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownTier}>{TIER_LABEL[row.tier]}</Text>
                <Text style={styles.breakdownTotal}>{row.total} total</Text>
              </View>
              <View style={styles.statPills}>
                <StatPill label="Not Started" value={row.notStarted} />
                <StatPill label="Searched – Found" value={row.searchedFound} />
                <StatPill label="Submitted" value={row.submitted} color={COLOR.warningEnd} />
                <StatPill label="Removed" value={row.removed} color={COLOR.successStart} />
                <StatPill label="Handled" value={row.handledByService} color={COLOR.successStart} />
              </View>
            </View>
          ))}
        </GlassCard>

        {/* 6. Brokers by category */}
        <GlassCard>
          <SectionTitle>Brokers by Category</SectionTitle>
          {byCategory.length === 0 ? (
            <Text style={styles.emptyText}>No categories yet.</Text>
          ) : (
            byCategory.map((row) => (
              <View key={row.category} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{row.category}</Text>
                  <Text style={styles.categoryMeta}>
                    {row.removed}/{row.count} removed
                  </Text>
                </View>
                <Text style={styles.categoryPct}>{row.pct}%</Text>
              </View>
            ))
          )}
        </GlassCard>

        {/* 7. Tier 1 quick reference */}
        <GlassCard style={{ marginBottom: 0 }}>
          <SectionTitle>Tier 1 – Crucial Brokers</SectionTitle>
          {tier1.length === 0 ? (
            <Text style={styles.emptyText}>No Tier 1 brokers tracked.</Text>
          ) : (
            tier1.map((row) => (
              <View key={row.name} style={styles.brokerRow}>
                <View style={styles.brokerInfo}>
                  <Text style={styles.brokerName}>{row.name}</Text>
                  <Text style={styles.brokerMeta}>
                    {(row.difficulty ?? '—') +
                      (row.estProcessingDays ? ` · ~${row.estProcessingDays}d` : '')}
                  </Text>
                </View>
                <View style={styles.brokerStatusWrap}>
                  <View
                    style={[styles.statusBadge, { borderColor: statusColor(row.status) }]}
                  >
                    <Text style={[styles.statusBadgeText, { color: statusColor(row.status) }]}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Text>
                  </View>
                  {row.verified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLOR.successStart}
                      style={{ marginTop: 4 }}
                    />
                  )}
                </View>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatPill = ({
  label,
  value,
  color = COLOR.textMuted,
}: {
  label: string;
  value: number;
  color?: string;
}) => (
  <View style={styles.statPill}>
    <Text style={[styles.statPillValue, { color }]}>{value}</Text>
    <Text style={styles.statPillLabel}>{label}</Text>
  </View>
);

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
    marginBottom: 24,
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
  glassCard: {
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: COLOR.white,
    marginBottom: 16,
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
  breakdownBlock: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownTier: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: COLOR.white },
  breakdownTotal: { fontFamily: 'Inter_400Regular', fontSize: 12, color: COLOR.textMuted },
  statPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 64,
  },
  statPillValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  statPillLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: COLOR.textMuted },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  categoryInfo: { flex: 1, paddingRight: 12 },
  categoryName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: COLOR.white },
  categoryMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: COLOR.textMuted, marginTop: 2 },
  categoryPct: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: COLOR.successStart },
  brokerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  brokerInfo: { flex: 1, paddingRight: 12 },
  brokerName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: COLOR.white },
  brokerMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: COLOR.textMuted, marginTop: 2 },
  brokerStatusWrap: { alignItems: 'flex-end' },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: COLOR.textMuted },
});
