import { COLOR } from '@/lib/theme/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Shared presentational pieces used by both the Dashboard tab and the
// "Data for Nerds" detail page. Kept here so the two screens stay in sync.

export const GlassCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => <View style={[styles.glassCard, style]}>{children}</View>;

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

export const StatPill = ({
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
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 64,
  },
  statPillValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  statPillLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: COLOR.textMuted },
});
