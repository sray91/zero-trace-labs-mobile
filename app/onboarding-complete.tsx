import { COLOR } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

/**
 * Post-onboarding confirmation splash. Shown once, right after `completeWelcome()` in
 * `app/welcome.tsx` flips `welcomeCompleted` to true — not gated on profile state, so it
 * only appears via that explicit navigation and never re-shows on later launches.
 */
export default function OnboardingCompleteScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={[COLOR.successStart, COLOR.successEnd]}
            style={styles.ringOuter}
          >
            <View style={styles.ringInner}>
              <Ionicons name="shield-checkmark" size={52} color={COLOR.successStart} />
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.title}>We&apos;ve received your data</Text>
        <Text style={styles.body}>
          Our team is already working to eradicate your information from the web. This takes
          time as we locate your listings across data brokers and submit removals on your
          behalf.{'\n\n'}Check back soon to watch your progress.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.ctaWrap} onPress={() => router.replace('/(tabs)')}>
          <LinearGradient
            colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Go to Dashboard</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOR.deepVoid },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: { marginBottom: 28 },
  ringOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: COLOR.deepVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: COLOR.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: COLOR.textMuted,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  ctaWrap: { width: '100%' },
  cta: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#02101F',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
