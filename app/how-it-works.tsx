import { COLOR } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  kicker: string;
  title: string;
  body: string;
  note?: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'search',
    kicker: 'Step 1',
    title: 'We hunt down your data',
    body: 'Our team scans hundreds of data broker sites to find every place your name, address, phone number, and relatives are being listed and sold.',
    note: 'Most people are exposed on 100+ brokers they’ve never heard of.',
  },
  {
    icon: 'create',
    kicker: 'Step 2',
    title: 'We file removals by hand',
    body: 'There’s no single “delete me” button. Every broker has its own opt-out process, so our specialists submit and track each request manually — one broker at a time.',
    note: 'This hands-on work is exactly why removals are thorough and stick.',
  },
  {
    icon: 'hourglass',
    kicker: 'Step 3',
    title: 'Brokers take their time',
    body: 'By law, brokers must honor removal requests — but many take days or even weeks to process them. We follow up, resubmit, and escalate until your listing is actually gone.',
    note: 'Typical removals land in 7–45 days depending on the broker.',
  },
  {
    icon: 'shield-checkmark',
    kicker: 'Step 4',
    title: 'We verify & keep watch',
    body: 'Once a broker confirms you’re removed, we re-check to make sure you stay gone — and catch it fast if your data quietly reappears down the line.',
    note: 'Your dashboard updates in real time as each broker clears.',
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const goToIndex = (next: number) => {
    const clamped = Math.max(0, Math.min(next, SLIDES.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, animated: true });
    setIndex(clamped);
  };

  const handleNext = () => {
    if (isLast) {
      router.back();
      return;
    }
    goToIndex(index + 1);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== index) setIndex(next);
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

      {/* Top bar — close + skip */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.topBtn}>
          <Ionicons name="close" size={24} color={COLOR.textMuted} />
        </Pressable>
        {!isLast && (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.topBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Paged slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name={slide.icon} size={44} color={COLOR.deepVoid} />
              </LinearGradient>
            </View>

            <Text style={styles.kicker}>{slide.kicker}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>

            {slide.note ? (
              <View style={styles.noteRow}>
                <Ionicons name="information-circle" size={16} color={COLOR.nuclearStart} />
                <Text style={styles.noteText}>{slide.note}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {/* Footer — dots + continue */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goToIndex(i)} hitSlop={8}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.ctaWrap} onPress={handleNext}>
          <LinearGradient
            colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{isLast ? 'Back to Dashboard' : 'Continue'}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOR.deepVoid },
  backgroundGlow: { position: 'absolute', top: -120, left: -60, right: -60, height: 360 },
  backgroundGradient: { flex: 1, borderRadius: 999, opacity: 0.6 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 44,
  },
  topBtn: { padding: 4, minWidth: 44, justifyContent: 'center' },
  skipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLOR.textMuted,
    textAlign: 'right',
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  iconWrap: { marginBottom: 32 },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLOR.nuclearStart,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    lineHeight: 34,
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
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR.glassBorder,
    backgroundColor: COLOR.glassBg,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: COLOR.white,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLOR.trackBg,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLOR.nuclearStart,
  },
  ctaWrap: { width: '100%' },
  ctaButton: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#02101F',
    letterSpacing: 0.5,
  },
});
