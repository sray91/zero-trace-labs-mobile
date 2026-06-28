import { COLOR } from '@/lib/theme/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

const DOT = 8;

// Reanimated v4 CSS animations (same idiom as components/hello-wave.tsx) — runs on the
// UI thread, no shared-value boilerplate. Kept slow + low-opacity so it reads as a quiet
// "still working" heartbeat rather than a loud spinner.
const dotAnim = {
  animationName: {
    '0%': { opacity: 0.55 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.55 },
  },
  animationDuration: '1800ms',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'ease-in-out',
} as const;

const pingAnim = {
  animationName: {
    '0%': { transform: [{ scale: 1 }], opacity: 0.4 },
    '70%': { transform: [{ scale: 2.8 }], opacity: 0 },
    '100%': { transform: [{ scale: 2.8 }], opacity: 0 },
  },
  animationDuration: '2400ms',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'ease-out',
} as const;

/**
 * Subtle "we're working on it" indicator for the dashboard header: a softly breathing
 * core dot with a slow radar-ping ring. Signals ongoing background activity without
 * pulling focus from the stats below.
 */
export function WorkingIndicator({
  label = 'Working in the background',
}: {
  label?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.ping, pingAnim]} />
        <Animated.View style={[styles.dot, dotAnim]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dotWrap: {
    width: DOT,
    height: DOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: COLOR.nuclearStart,
  },
  ping: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: COLOR.nuclearStart,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLOR.textMuted,
    letterSpacing: 0.2,
  },
});
