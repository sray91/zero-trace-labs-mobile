import { GlassCard, SectionTitle, StatPill } from '@/components/dashboard/ui';
import { api } from '@/convex/_generated/api';
import { COLOR, STATUS_LABEL, statusColor, TIER_LABEL } from '@/lib/theme/colors';
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

export default function DataForNerdsScreen() {
  const router = useRouter();
  const data = useQuery(api.dashboard.forCurrentUser);

  if (data === undefined) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLOR.nuclearStart} />
      </View>
    );
  }

  const { byTier, byCategory, tier1 } = data;

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
        {/* Header with back navigation */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backRow}
        >
          <Ionicons name="chevron-back" size={18} color={COLOR.nuclearStart} />
          <Text style={styles.backText}>Dashboard</Text>
        </Pressable>
        <Text style={styles.title}>Data for Nerds</Text>
        <Text style={styles.subtitle}>
          The full breakdown — every tier, category, and Tier 1 broker.
        </Text>

        {/* Status breakdown by tier */}
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

        {/* Brokers by category */}
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

        {/* Tier 1 quick reference */}
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
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLOR.nuclearStart,
    marginLeft: 2,
  },
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
