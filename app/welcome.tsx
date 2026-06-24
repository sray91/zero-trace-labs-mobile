import { api } from '@/convex/_generated/api';
import { COLOR } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

const TOTAL_STEPS = 3;

const STEP_TITLE: Record<number, string> = {
  1: "Welcome! Let's get started",
  2: 'Privacy & consent',
  3: "You're all set",
};

const STEP_SUBTITLE: Record<number, string> = {
  1: 'Tell us about yourself so our team can find and remove your data from data brokers.',
  2: 'Review and accept how your information is used.',
  3: 'Your account is ready. Track your removal progress on the dashboard.',
};

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'characters';
  maxLength?: number;
}

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  keyboardType = 'default',
  autoCapitalize = 'words',
  maxLength,
}: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>
      {label}
      {required ? ' *' : ''}
    </Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(139,147,182,0.5)"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
    />
  </View>
);

const Checkbox = ({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <Pressable style={styles.checkRow} onPress={onToggle}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={16} color={COLOR.deepVoid} />}
    </View>
    <Text style={styles.checkLabel}>{children}</Text>
  </Pressable>
);

export default function WelcomeScreen() {
  const profile = useQuery(api.users.getProfile);
  const upsertProfile = useMutation(api.users.upsertProfile);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Step 2 — consent
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Prefill from any existing profile; skip the flow if already completed.
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setDateOfBirth(profile.dateOfBirth ?? '');
    setPhoneNumber(profile.phoneNumber ?? '');
    setAddressLine1(profile.addressLine1 ?? '');
    setAddressLine2(profile.addressLine2 ?? '');
    setCity(profile.city ?? '');
    setStateField(profile.state ?? '');
    setZipCode(profile.zipCode ?? '');
    setPrivacyConsent(profile.privacyConsentGiven ?? false);
    setTermsAccepted(profile.termsAccepted ?? false);
    if (profile.welcomeCompleted) {
      router.replace('/(tabs)');
    }
  }, [profile]);

  const savePersonalInfo = async () => {
    setSaving(true);
    setError('');
    try {
      await upsertProfile({
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || undefined,
        phoneNumber: phoneNumber || undefined,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state: stateField,
        zipCode,
        welcomeStep: 1,
      });
      return true;
    } catch (e) {
      console.error('Error saving personal info:', e);
      setError('Failed to save information. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const completeWelcome = async () => {
    setSaving(true);
    setError('');
    try {
      await upsertProfile({
        privacyConsentGiven: privacyConsent,
        termsAccepted,
        tourCompleted: true,
        welcomeCompleted: true,
        welcomeStep: TOTAL_STEPS,
      });
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Error completing welcome:', e);
      setError('Failed to complete setup. Please try again.');
      setSaving(false);
    }
  };

  const handleNext = async () => {
    setError('');
    if (step === 1) {
      if (!firstName || !lastName || !addressLine1 || !city || !stateField || !zipCode) {
        setError('Please fill in all required fields.');
        return;
      }
      const saved = await savePersonalInfo();
      if (!saved) return;
    }
    if (step === 2) {
      if (!privacyConsent || !termsAccepted) {
        setError('Please accept the privacy policy and terms of service to continue.');
        return;
      }
    }
    if (step === TOTAL_STEPS) {
      await completeWelcome();
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  // While the profile query resolves (and we may redirect if already completed).
  if (profile === undefined) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLOR.nuclearStart} />
      </View>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.stepRow}>
              <Text style={styles.title}>{STEP_TITLE[step]}</Text>
              <Text style={styles.stepCount}>
                Step {step} of {TOTAL_STEPS}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.subtitle}>{STEP_SUBTITLE[step]}</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Step 1 — personal info */}
          {step === 1 && (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Field label="First name" value={firstName} onChangeText={setFirstName} required />
                </View>
                <View style={styles.half}>
                  <Field label="Last name" value={lastName} onChangeText={setLastName} required />
                </View>
              </View>
              <Field
                label="Date of birth"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
              />
              <Field
                label="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="(123) 456-7890"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              <Field
                label="Address line 1"
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="123 Main St"
                required
              />
              <Field
                label="Address line 2"
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Apt 4B"
              />
              <View style={styles.row}>
                <View style={styles.twoThirds}>
                  <Field label="City" value={city} onChangeText={setCity} required />
                </View>
                <View style={styles.third}>
                  <Field
                    label="State"
                    value={stateField}
                    onChangeText={setStateField}
                    placeholder="CA"
                    autoCapitalize="characters"
                    maxLength={2}
                    required
                  />
                </View>
              </View>
              <Field
                label="ZIP code"
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="12345"
                keyboardType="number-pad"
                autoCapitalize="none"
                maxLength={10}
              />
            </View>
          )}

          {/* Step 2 — privacy & consent */}
          {step === 2 && (
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={20} color={COLOR.nuclearStart} />
                <Text style={styles.infoText}>
                  Your privacy is our priority. We use your information solely so our team can
                  remove your data from data brokers on your behalf. We never sell or share it.
                </Text>
              </View>

              <Text style={styles.policyHeading}>How your data is used</Text>
              <Text style={styles.policyText}>
                We use the personal information you provide to locate your listings on data
                broker sites, submit opt-out / removal requests for you, and monitor for
                re-appearance. You can request to view, update, or delete your information at
                any time. We comply with CCPA, GDPR, and other privacy regulations.
              </Text>

              <View style={styles.consentGroup}>
                <Checkbox checked={privacyConsent} onToggle={() => setPrivacyConsent((v) => !v)}>
                  I have read and agree to the Privacy Policy, and understand how my data is used
                  to remove my information from data brokers.
                </Checkbox>
                <Checkbox checked={termsAccepted} onToggle={() => setTermsAccepted((v) => !v)}>
                  I agree to the Terms of Service and acknowledge that 0Trace will act on my
                  behalf to submit data removal requests.
                </Checkbox>
              </View>
            </View>
          )}

          {/* Step 3 — completion */}
          {step === 3 && (
            <View style={styles.card}>
              <View style={styles.successWrap}>
                <LinearGradient
                  colors={[COLOR.successStart, COLOR.successEnd]}
                  style={styles.successRingOuter}
                >
                  <View style={styles.successRingInner}>
                    <Ionicons name="checkmark-circle" size={44} color={COLOR.successStart} />
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.completeTitle}>Welcome to 0Trace</Text>
              <Text style={styles.completeBody}>
                Our team manages your broker removals behind the scenes. Head to your dashboard
                to track progress — confirmed removals, opt-outs in flight, and what&apos;s still
                pending — updated as we work.
              </Text>
            </View>
          )}

          {/* Navigation */}
          <View style={styles.nav}>
            {step > 1 && (
              <Pressable
                style={[styles.navButton, styles.backButton]}
                onPress={handleBack}
                disabled={saving}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.nextWrap}
              onPress={handleNext}
              disabled={saving}
            >
              <LinearGradient
                colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextButton}
              >
                {saving ? (
                  <ActivityIndicator color={COLOR.deepVoid} />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {step === TOTAL_STEPS ? 'Get Started' : 'Continue'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 20 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: COLOR.white,
    flex: 1,
    paddingRight: 12,
  },
  stepCount: { fontFamily: 'Inter_500Medium', fontSize: 12, color: COLOR.textMuted },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: COLOR.trackBg,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 999, backgroundColor: COLOR.nuclearStart },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: COLOR.textMuted,
    marginTop: 12,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: COLOR.danger,
    backgroundColor: 'rgba(255,84,112,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontFamily: 'Inter_500Medium', color: COLOR.danger, fontSize: 13 },
  card: {
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  twoThirds: { flex: 2 },
  third: { flex: 1 },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLOR.white,
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLOR.white,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLOR.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  infoText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: COLOR.textMuted,
  },
  policyHeading: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: COLOR.white,
    marginBottom: 8,
  },
  policyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: COLOR.textMuted,
    marginBottom: 20,
  },
  consentGroup: {
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLOR.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: COLOR.nuclearStart, borderColor: COLOR.nuclearStart },
  checkLabel: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: COLOR.white,
  },
  successWrap: { alignItems: 'center', marginBottom: 16 },
  successRingOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successRingInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLOR.deepVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: COLOR.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  completeBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: COLOR.textMuted,
    textAlign: 'center',
  },
  nav: { flexDirection: 'row', gap: 12, marginTop: 24 },
  navButton: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLOR.glassBorder,
  },
  backButtonText: { fontFamily: 'Outfit_600SemiBold', color: COLOR.white, fontSize: 15 },
  nextWrap: { flex: 2 },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#02101F',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
