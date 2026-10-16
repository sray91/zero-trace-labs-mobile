import { GlassCard, SectionTitle } from '@/components/dashboard/ui';
import { api } from '@/convex/_generated/api';
import { COLOR } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const CONTEXT_OPTIONS = [
  { value: 'texted_me', label: 'Texted Me', icon: 'chatbubble-ellipses-outline' as const },
  { value: 'called_me', label: 'Called Me', icon: 'call-outline' as const },
  { value: 'found_online', label: 'Found Online', icon: 'globe-outline' as const },
  { value: 'other', label: 'Other', icon: 'help-circle-outline' as const },
];

function formatPhone(digits: string): string {
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PhoneLookupScreen() {
  const [number, setNumber] = useState('');
  const [selectedContext, setSelectedContext] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const history = useQuery(api.phoneLookups.history);
  const stats = useQuery(api.phoneLookups.stats);
  const lookup = useMutation(api.phoneLookups.lookup);
  const removeLookup = useMutation(api.phoneLookups.remove);

  const handleLookup = async () => {
    const trimmed = number.trim();
    if (!trimmed) {
      Alert.alert('Enter a number', 'Type or paste the phone number you want to look up.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await lookup({
        rawNumber: trimmed,
        context: selectedContext,
        notes: notes.trim() || undefined,
      });
      setLastResult(result);
      setNumber('');
      setNotes('');
      setSelectedContext(undefined);
    } catch (err: any) {
      Alert.alert('Lookup Failed', err?.message ?? 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Lookup', 'Delete this entry from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeLookup({ id: id as any }),
      },
    ]);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.title}>Number Tracker</Text>
          <Text style={styles.subtitle}>
            Look up unknown numbers that text or call you. Free for all users.
          </Text>

          {/* Stats row */}
          {stats && stats.total > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Tracked</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={[styles.statValue, { color: COLOR.warningEnd }]}>{stats.texted}</Text>
                <Text style={styles.statLabel}>Texted</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={[styles.statValue, { color: COLOR.nuclearStart }]}>{stats.called}</Text>
                <Text style={styles.statLabel}>Called</Text>
              </View>
            </View>
          )}

          {/* Lookup form */}
          <GlassCard>
            <SectionTitle>Look Up a Number</SectionTitle>

            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              placeholderTextColor={COLOR.textMuted}
              value={number}
              onChangeText={setNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            {/* Context selector */}
            <Text style={styles.fieldLabel}>What happened?</Text>
            <View style={styles.contextRow}>
              {CONTEXT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.contextChip,
                    selectedContext === opt.value && styles.contextChipActive,
                  ]}
                  onPress={() =>
                    setSelectedContext(selectedContext === opt.value ? undefined : opt.value)
                  }
                >
                  <Ionicons
                    name={opt.icon}
                    size={14}
                    color={selectedContext === opt.value ? COLOR.deepVoid : COLOR.textMuted}
                  />
                  <Text
                    style={[
                      styles.contextChipText,
                      selectedContext === opt.value && styles.contextChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional) — e.g. 'Claimed to be from my bank'"
              placeholderTextColor={COLOR.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            {/* Styled on an inner View: NativeWind's Pressable wrapper drops a
                function-form `style`, which left the button with no background. */}
            <Pressable onPress={handleLookup} disabled={isSubmitting}>
              {({ pressed }) => (
                <View
                  style={[
                    styles.lookupButton,
                    pressed && styles.lookupButtonPressed,
                    isSubmitting && styles.lookupButtonDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={COLOR.deepVoid} />
                  ) : (
                    <>
                      <Ionicons name="search" size={16} color={COLOR.deepVoid} />
                      <Text style={styles.lookupButtonText}>Look Up</Text>
                    </>
                  )}
                </View>
              )}
            </Pressable>
          </GlassCard>

          {/* Last result */}
          {lastResult && (
            <GlassCard>
              <SectionTitle>Result</SectionTitle>
              <View style={styles.resultRow}>
                <Ionicons
                  name={lastResult.isNew ? 'add-circle' : 'refresh-circle'}
                  size={20}
                  color={COLOR.successStart}
                />
                <Text style={styles.resultNumber}>{formatPhone(lastResult.normalized)}</Text>
              </View>
              {lastResult.region && (
                <View style={styles.resultDetail}>
                  <Ionicons name="location-outline" size={14} color={COLOR.textMuted} />
                  <Text style={styles.resultDetailText}>{lastResult.region}</Text>
                </View>
              )}
              {lastResult.lineTypeGuess !== 'unknown' && (
                <View style={styles.resultDetail}>
                  <Ionicons name="cellular-outline" size={14} color={COLOR.textMuted} />
                  <Text style={styles.resultDetailText}>
                    {lastResult.lineTypeGuess === 'toll_free' ? 'Toll-Free' : lastResult.lineTypeGuess}
                  </Text>
                </View>
              )}
              <View style={styles.resultDetail}>
                <Ionicons name="shield-outline" size={14} color={COLOR.textMuted} />
                <Text style={styles.resultDetailText}>
                  {lastResult.brokersFound} broker{lastResult.brokersFound !== 1 ? 's' : ''} can search this number
                </Text>
              </View>
              {!lastResult.isNew && (
                <Text style={styles.resultNote}>Already in your tracker — updated with new info.</Text>
              )}
            </GlassCard>
          )}

          {/* History */}
          <GlassCard style={{ marginBottom: 0 }}>
            <SectionTitle>Your Tracked Numbers</SectionTitle>
            {!history || history.length === 0 ? (
              <Text style={styles.emptyText}>
                No numbers tracked yet. Look up a number above to start building your list.
              </Text>
            ) : (
              history.map((item: any) => (
                <View key={item._id} style={styles.historyRow}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyNumber}>{formatPhone(item.normalizedNumber)}</Text>
                    <View style={styles.historyMeta}>
                      {item.region && (
                        <Text style={styles.historyMetaText}>{item.region}</Text>
                      )}
                      {item.context && (
                        <View style={styles.contextBadge}>
                          <Text style={styles.contextBadgeText}>
                            {CONTEXT_OPTIONS.find((c) => c.value === item.context)?.label ?? item.context}
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.notes && (
                      <Text style={styles.historyNotes} numberOfLines={2}>
                        {item.notes}
                      </Text>
                    )}
                    <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                    {item.brokers && item.brokers.length > 0 && (
                      <Text style={styles.historyBrokers}>
                        Searchable on: {item.brokers.map((b: any) => b.name).join(', ')}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleDelete(item._id)}
                    hitSlop={8}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLOR.danger} />
                  </Pressable>
                </View>
              ))
            )}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOR.deepVoid },
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 20,
    color: COLOR.white,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: COLOR.textMuted,
    marginTop: 2,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: COLOR.hairline,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLOR.white,
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COLOR.textMuted,
    marginBottom: 8,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLOR.hairline,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  contextChipActive: {
    backgroundColor: COLOR.nuclearStart,
    borderColor: COLOR.nuclearStart,
  },
  contextChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLOR.textMuted,
  },
  contextChipTextActive: {
    color: COLOR.deepVoid,
  },
  lookupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLOR.nuclearStart,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  lookupButtonPressed: {
    opacity: 0.8,
  },
  lookupButtonDisabled: {
    opacity: 0.5,
  },
  lookupButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: COLOR.deepVoid,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  resultNumber: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: COLOR.white,
  },
  resultDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  resultDetailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLOR.textMuted,
  },
  resultNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLOR.warningEnd,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLOR.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  historyInfo: {
    flex: 1,
    paddingRight: 8,
  },
  historyNumber: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: COLOR.white,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  historyMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLOR.textMuted,
  },
  contextBadge: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  contextBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: COLOR.nuclearStart,
  },
  historyNotes: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLOR.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  historyDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: COLOR.textMuted,
    marginTop: 4,
    opacity: 0.6,
  },
  historyBrokers: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: COLOR.nuclearStart,
    marginTop: 4,
    opacity: 0.8,
  },
  deleteButton: {
    padding: 4,
  },
});
