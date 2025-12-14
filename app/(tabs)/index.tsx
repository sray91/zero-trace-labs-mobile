import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { router } from 'expo-router';
import { WhopPaywall } from '@/components/paywall/whop-paywall';

type ExperienceStage = 'welcome' | 'scan' | 'results' | 'paywall' | 'dashboard';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type PlanId = 'free' | 'basic' | 'premium';

interface ScanEvent {
  name: string;
  detail: string;
  severity: Severity;
}

interface PlanCard {
  id: PlanId;
  title: string;
  ribbon?: string;
  price: string;
  cadence: string;
  blurb: string;
  perks: string[];
  accent: string;
}

const COLOR = {
  deepVoid: '#0C0E1A',
  nuclearStart: '#00D4FF',
  nuclearEnd: '#006CFF',
  warningStart: '#FFE066',
  warningEnd: '#FF9F1C',
  successStart: '#3DD598',
  successEnd: '#1EB980',
  glassBorder: 'rgba(0, 212, 255, 0.35)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  textMuted: '#8B93B6',
};

const STAGE_FLOW: ExperienceStage[] = ['welcome', 'scan', 'results', 'paywall', 'dashboard'];
const STAGE_LABELS: Record<ExperienceStage, string> = {
  welcome: 'Welcome',
  scan: 'Live Scan',
  results: 'Critical Findings',
  paywall: 'Authorize Detonation',
  dashboard: 'Clean Slate',
};

const SCAN_MESSAGES = [
  'Checking Acxiom...',
  'Pinging LexisNexis...',
  'Interpolating breach archives...',
  'Found email address...',
  'Found home IP...',
  'Mapping relatives graph...',
  'Decrypting broker payloads...',
];

const SCAN_EVENTS: ScanEvent[] = [
  { name: 'Acxiom', detail: 'Home Address, DOB', severity: 'critical' },
  { name: 'PeopleFinder', detail: 'Phone, Relatives', severity: 'high' },
  { name: 'Whitepages', detail: 'Full Name, IP', severity: 'medium' },
  { name: 'Spokeo', detail: 'Photos, Social Handles', severity: 'high' },
  { name: 'LexisNexis', detail: 'Financial Traces', severity: 'critical' },
  { name: 'Dark Node 7', detail: 'Credential Dump', severity: 'critical' },
  { name: 'RocketReach', detail: 'Work Email, Role', severity: 'medium' },
];

const BROKER_FINDINGS = [
  { name: 'Acxiom', detail: 'Contains: Home Address, DOB', type: 'Broker' },
  { name: 'PeopleFinder', detail: 'Contains: Phone, Relatives', type: 'Broker' },
  { name: 'Dark Web Exchange', detail: 'Contains: Credentials, IP', type: 'Dark Web' },
  { name: 'LexisNexis', detail: 'Contains: Financial Records', type: 'Broker' },
];

const PLAN_CARDS: PlanCard[] = [
  {
    id: 'free',
    title: 'FREE TRIAL',
    ribbon: 'START HERE',
    price: 'Free',
    cadence: '7-day trial',
    blurb: 'Try before you commit',
    perks: ['Basic scans', 'Limited removals', 'No credit card required'],
    accent: COLOR.successStart,
  },
  {
    id: 'basic',
    title: 'BASIC',
    price: '$14.99/mo',
    cadence: 'Billed monthly',
    blurb: 'Essential protection',
    perks: ['Monthly detonation sweeps', 'Standard broker blocking', 'Email support'],
    accent: COLOR.nuclearStart,
  },
  {
    id: 'premium',
    title: 'PREMIUM',
    ribbon: 'MOST POPULAR',
    price: '$29.99/mo',
    cadence: 'Billed monthly',
    blurb: 'Maximum protection',
    perks: ['On-demand wipes', 'Dark web surveillance', 'Priority response', '24/7 monitoring'],
    accent: COLOR.warningEnd,
  },
];

const TRUST_BENEFITS = [
  { icon: 'lock-closed', label: 'Encrypted Payment' },
  { icon: 'shield-checkmark', label: 'Swiss-Based' },
  { icon: 'checkmark-circle', label: 'No Logs' },
];

const DASHBOARD_METRICS = [
  { label: 'Records Nuked', value: '342' },
  { label: 'Brokers Blocked', value: '512' },
  { label: 'Active Monitor', value: '24/7' },
];

const LIVE_ACTIVITY = [
  { icon: 'sparkles', text: 'Removed from Whitepages (2m ago)', color: COLOR.successStart },
  { icon: 'scan-circle', text: 'Hourly scan complete. No new threats.', color: COLOR.nuclearStart },
  { icon: 'shield-checkmark', text: 'Firewall signature updated.', color: '#8B5CF6' },
];


const severityColors: Record<Severity, string> = {
  critical: '#FF5470',
  high: '#FFB347',
  medium: '#FFD670',
  low: '#3DD598',
  info: '#48C6EF',
};

const severityTitles: Record<Severity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFO',
};

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

const GlassCard = ({ children, style, noPadding }: GlassCardProps) => (
  <View style={[styles.glassCard, !noPadding && styles.glassCardBody, style]}>{children}</View>
);

interface GradientButtonProps {
  label: string;
  colors: string[];
  textColor?: string;
  onPress: () => void;
  pulse?: boolean;
}

const GradientButton = ({ label, colors, textColor = COLOR.deepVoid, onPress, pulse }: GradientButtonProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, pulseAnim]);

  return (
    <Pressable onPress={onPress} style={styles.gradientPressable}>
      <Animated.View style={[styles.gradientAnimated, pulse && { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
          <Text style={[styles.buttonLabel, { color: textColor }]}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const StageIndicator = ({ currentStage }: { currentStage: ExperienceStage }) => (
  <View style={styles.stageIndicator}>
    <View style={styles.stageDots}>
      {STAGE_FLOW.map((item) => {
        const active = item === currentStage;
        return <View key={item} style={[styles.stageDot, active && styles.stageDotActive]} />;
      })}
    </View>
    <Text style={styles.stageIndicatorText}>{STAGE_LABELS[currentStage]}</Text>
  </View>
);

const WelcomeStage = ({ onStart }: { onStart: () => void }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={[styles.stageBase, styles.stageSpacing]}>
      <View>
        <Text style={styles.statusChip}>SYSTEM ONLINE</Text>
        <View style={styles.heroWrapper}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <LinearGradient colors={[COLOR.nuclearStart, COLOR.nuclearEnd]} style={styles.heroOrb}>
              <View style={styles.heroCore} />
            </LinearGradient>
            <View style={styles.heroScanLines} />
          </Animated.View>
        </View>
        <Text style={styles.headline}>THE NUCLEAR OPTION FOR SPAM.</Text>
        <Text style={styles.subhead}>
          They can&apos;t sell what we annihilate. Zero trace left behind.
        </Text>
      </View>
      <View>
        <GradientButton
          label="INITIATE FREE SCAN"
          colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
          textColor="#02101F"
          onPress={onStart}
        />
        <Text style={styles.caption}>0Trace Detonation Suite • Free scan hooks the mark.</Text>
      </View>
    </View>
  );
};

const ScanStage = ({
  progress,
  message,
  stream,
}: {
  progress: number;
  message: string;
  stream: ScanEvent[];
}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4500,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      rotation.setValue(0);
    };
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.stageBase, styles.stageSpacing]}>
      <View>
        <Text style={styles.sectionLabel}>Scanning Environment...</Text>
        <View style={styles.progressRingContainer}>
          <Animated.View style={[styles.progressOuter, { transform: [{ rotate: spin }] }]}>
            <LinearGradient colors={[COLOR.nuclearStart, COLOR.nuclearEnd]} style={styles.progressGradient}>
              <View style={styles.progressHollow} />
            </LinearGradient>
          </Animated.View>
          <View style={styles.progressInner}>
            <Text style={styles.progressValue}>{Math.min(100, Math.round(progress))}%</Text>
            <Text style={styles.progressMessage}>{message}</Text>
          </View>
        </View>
        <View style={styles.streamContainer}>
          {stream.map((entry, idx) => (
            <GlassCard key={`${entry.name}-${idx}`} style={styles.streamRow}>
              <View style={[styles.streamIcon, { backgroundColor: `${severityColors[entry.severity]}22` }]}>
                <Ionicons name="alert-circle" size={18} color={severityColors[entry.severity]} />
              </View>
              <View style={styles.streamCopy}>
                <Text style={styles.streamTitle}>{entry.name}</Text>
                <Text style={styles.streamDetail}>{entry.detail}</Text>
              </View>
              <Text style={[styles.streamSeverity, { color: severityColors[entry.severity] }]}>
                {severityTitles[entry.severity]}
              </Text>
            </GlassCard>
          ))}
        </View>
      </View>
      <Text style={styles.footerCaption}>Searching 500+ dark web and broker databases.</Text>
    </View>
  );
};

const ResultsStage = ({ onDetonate }: { onDetonate: () => void }) => (
  <View style={[styles.stageBase, styles.stageSpacing]}>
    <View>
      <Text style={styles.sectionLabel}>SCAN COMPLETE</Text>
      <Text style={styles.metricValue}>342</Text>
      <Text style={styles.metricLabel}>ACTIVE TRACES FOUND</Text>
      <Text style={styles.subhead}>Your personal data is currently for sale on the open market.</Text>
      <GlassCard style={styles.evidenceCard}>
        <Text style={styles.cardTitle}>Evidence Payload</Text>
        {BROKER_FINDINGS.map((finding) => (
          <View key={finding.name} style={styles.evidenceRow}>
            <View style={styles.evidenceIcon}>
              <Ionicons name="server" size={18} color="#FF5470" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.evidenceTitle}>{finding.name}</Text>
              <Text style={styles.evidenceDetail}>{finding.detail}</Text>
            </View>
            <Text style={styles.evidenceBadge}>{finding.type}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
    <View>
      <GradientButton
        label="DETONATE ALL 342 RECORDS"
        colors={[COLOR.warningStart, COLOR.warningEnd]}
        textColor={COLOR.deepVoid}
        onPress={onDetonate}
        pulse
      />
      <Text style={styles.ctaSubtext}>30-day money-back guarantee. Total erasure.</Text>
    </View>
  </View>
);

const PaywallStage = ({
  selectedPlan,
  onSelectPlan,
  onActivate,
}: {
  selectedPlan: PlanId;
  onSelectPlan: (plan: PlanId) => void;
  onActivate: () => void;
}) => (
  <View style={[styles.stageBase, styles.stageSpacing]}>
    <View>
      <Text style={styles.sectionLabel}>AUTHORIZE DETONATION</Text>
      <Text style={styles.subhead}>To wipe these records and monitor for reappearance, activate 0Trace Prime.</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.planScroll}
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {PLAN_CARDS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <Pressable key={plan.id} onPress={() => onSelectPlan(plan.id)} style={styles.planPressable}>
              <GlassCard
                style={[
                  styles.planCard,
                  { borderColor: plan.accent },
                  isSelected && styles.planCardSelected,
                ]}
              >
                {plan.ribbon ? (
                  <View style={[styles.planRibbon, { backgroundColor: plan.accent }]}>
                    <Text style={styles.planRibbonText}>{plan.ribbon}</Text>
                  </View>
                ) : null}
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planCadence}>{plan.cadence}</Text>
                <Text style={styles.planBlurb}>{plan.blurb}</Text>
                <View style={styles.planPerks}>
                  {plan.perks.map((perk) => (
                    <View key={perk} style={styles.planPerkRow}>
                      <Ionicons name="checkmark-circle" size={16} color={plan.accent} />
                      <Text style={styles.planPerkText}>{perk}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </Pressable>
          );
        })}
      </ScrollView>
      <GlassCard style={styles.trustBar}>
        {TRUST_BENEFITS.map((benefit) => (
          <View key={benefit.label} style={styles.trustItem}>
            <Ionicons name={benefit.icon as any} size={16} color={COLOR.nuclearStart} />
            <Text style={styles.trustText}>{benefit.label}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
    <GradientButton
      label="ACTIVATE & WIPE NOW"
      colors={[COLOR.nuclearStart, COLOR.nuclearEnd]}
      textColor="#02101F"
      onPress={onActivate}
    />
  </View>
);

const DashboardStage = ({ onRestart }: { onRestart: () => void }) => (
  <View style={[styles.stageBase, styles.stageSpacing]}>
    <View>
      <View style={styles.navHeader}>
        <Image
          source={require('@/assets/images/0tracelabs-logo-dark.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.successRingWrapper}>
        <LinearGradient colors={[COLOR.successStart, COLOR.successEnd]} style={styles.successRingOuter}>
          <View style={styles.successRingInner}>
            <Ionicons name="checkmark-circle" size={48} color="#3DD598" />
          </View>
        </LinearGradient>
      </View>
      <Text style={styles.headline}>ZERO TRACE</Text>
      <Text style={[styles.subhead, { color: COLOR.successStart }]}>SYSTEM SECURE.</Text>
      <View style={styles.metricRow}>
        {DASHBOARD_METRICS.map((metric) => (
          <GlassCard key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricCardValue}>{metric.value}</Text>
            <Text style={styles.metricCardLabel}>{metric.label}</Text>
          </GlassCard>
        ))}
      </View>
      <GlassCard style={styles.liveLogCard}>
        <Text style={styles.cardTitle}>Live Log</Text>
        {LIVE_ACTIVITY.map((item) => (
          <View key={item.text} style={styles.logRow}>
            <View style={[styles.logIcon, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
            </View>
            <Text style={styles.logText}>{item.text}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
    <View style={styles.dashboardActions}>
      <Pressable onPress={onRestart} style={styles.restartLink}>
        <Text style={styles.restartText}>Restart Detonation Flow</Text>
      </Pressable>
    </View>
  </View>
);

export default function HomeScreen() {
  const { welcomeCompleted, completeWelcome, initialize: initializeOnboarding } = useOnboardingStore();
  const { hasActiveSubscription, customer } = useSubscriptionStore();
  const [stage, setStage] = useState<ExperienceStage>('welcome');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free');
  const [scanProgress, setScanProgress] = useState(12);
  const [scanMessage, setScanMessage] = useState(SCAN_MESSAGES[0]);
  const [scanStream, setScanStream] = useState<ScanEvent[]>([]);
  const [showWhopPaywall, setShowWhopPaywall] = useState(false);

  // Initialize onboarding state and set initial stage
  useEffect(() => {
    initializeOnboarding();
  }, [initializeOnboarding]);

  // Skip to dashboard if welcome already completed AND has active subscription
  useEffect(() => {
    if (welcomeCompleted && hasActiveSubscription() && stage === 'welcome') {
      setStage('dashboard');
    }
  }, [welcomeCompleted, hasActiveSubscription, stage]);

  useEffect(() => {
    let progressTimer: ReturnType<typeof setInterval> | undefined;
    let messageTimer: ReturnType<typeof setInterval> | undefined;
    let streamTimer: ReturnType<typeof setInterval> | undefined;
    let autoAdvance: ReturnType<typeof setTimeout> | undefined;

    if (stage === 'scan') {
      setScanProgress(12);
      setScanStream([]);
      setScanMessage(SCAN_MESSAGES[0]);
      let messageIndex = 0;
      let streamIndex = 0;

      messageTimer = setInterval(() => {
        messageIndex = (messageIndex + 1) % SCAN_MESSAGES.length;
        setScanMessage(SCAN_MESSAGES[messageIndex]);
      }, 900);

      progressTimer = setInterval(() => {
        setScanProgress((prev) => Math.min(100, prev + 8 + Math.random() * 10));
      }, 500);

      streamTimer = setInterval(() => {
        setScanStream((prev) => {
          const next = SCAN_EVENTS[streamIndex % SCAN_EVENTS.length];
          streamIndex += 1;
          const updated = [...prev, next];
          return updated.slice(-6);
        });
      }, 600);

      autoAdvance = setTimeout(() => setStage('results'), 6500);
    }

    return () => {
      if (progressTimer) clearInterval(progressTimer);
      if (messageTimer) clearInterval(messageTimer);
      if (streamTimer) clearInterval(streamTimer);
      if (autoAdvance) clearTimeout(autoAdvance);
    };
  }, [stage]);

  const renderStage = () => {
    // Show Whop paywall if triggered
    if (showWhopPaywall) {
      return (
        <WhopPaywall
          onSuccess={() => {
            setShowWhopPaywall(false);
            completeWelcome();
            setStage('dashboard');
          }}
          onDismiss={() => {
            setShowWhopPaywall(false);
            // Keep them on paywall stage if they dismiss
          }}
        />
      );
    }

    switch (stage) {
      case 'welcome':
        return <WelcomeStage onStart={() => setStage('scan')} />;
      case 'scan':
        return <ScanStage progress={scanProgress} message={scanMessage} stream={scanStream} />;
      case 'results':
        return <ResultsStage onDetonate={() => setStage('paywall')} />;
      case 'paywall':
        // Show button to trigger Superwall instead of mock paywall
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLOR.deepVoid, padding: 20 }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
              AUTHORIZE DETONATION
            </Text>
            <Text style={{ color: COLOR.textMuted, marginBottom: 32, textAlign: 'center' }}>
              Choose your plan to activate and wipe your data
            </Text>
            <Pressable
              onPress={() => setShowWhopPaywall(true)}
              style={{
                backgroundColor: COLOR.nuclearStart,
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 12,
                minWidth: 250,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#02101F', fontWeight: 'bold', fontSize: 16 }}>
                VIEW PRICING OPTIONS
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStage('results')}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: COLOR.textMuted, fontSize: 14 }}>← Go Back</Text>
            </Pressable>
          </View>
        );
      case 'dashboard':
        return <DashboardStage onRestart={() => setStage('welcome')} />;
      default:
        return null;
    }
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
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            welcomeCompleted && { paddingBottom: 80 }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {renderStage()}
        </ScrollView>
        <StageIndicator currentStage={stage} />
      </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  stageBase: {
    width: '100%',
    minHeight: 640,
    justifyContent: 'space-between',
  },
  stageSpacing: {
    gap: 32,
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
  gradientPressable: {
    width: '100%',
  },
  gradientAnimated: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonLabel: {
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1,
    fontSize: 16,
  },
  stageIndicator: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  stageDots: {
    flexDirection: 'row',
    gap: 8,
  },
  stageDot: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
  },
  stageDotActive: {
    backgroundColor: COLOR.nuclearStart,
    shadowColor: COLOR.nuclearStart,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { height: 0, width: 0 },
  },
  stageIndicatorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLOR.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statusChip: {
    fontFamily: 'Inter_600SemiBold',
    color: COLOR.nuclearStart,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 20,
  },
  heroWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroOrb: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLOR.nuclearEnd,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  heroCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#021226',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroScanLines: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 1,
  },
  sectionLabel: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 14,
    marginBottom: 24,
  },
  progressRingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 120,
    padding: 10,
  },
  progressHollow: {
    flex: 1,
    borderRadius: 110,
    backgroundColor: 'rgba(12, 14, 26, 0.9)',
  },
  progressInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(12,14,26,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  progressValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 48,
    color: '#ffffff',
  },
  progressMessage: {
    fontFamily: 'Inter_500Medium',
    color: COLOR.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  streamContainer: {
    gap: 12,
  },
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  streamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamCopy: {
    flex: 1,
  },
  streamTitle: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
  },
  streamDetail: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  streamSeverity: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
  footerCaption: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  metricValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 72,
    color: '#FF5470',
  },
  metricLabel: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 4,
    marginTop: 8,
  },
  evidenceCard: {
    marginTop: 32,
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
    backgroundColor: 'rgba(255,84,112,0.15)',
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
    color: COLOR.warningStart,
    fontSize: 12,
  },
  ctaSubtext: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  planScroll: {
    gap: 16,
    paddingRight: 24,
  },
  planPressable: {
    width: 260,
  },
  planCard: {
    gap: 12,
    minHeight: 320,
  },
  planCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  planRibbon: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planRibbonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COLOR.deepVoid,
  },
  planTitle: {
    fontFamily: 'Outfit_700Bold',
    color: '#ffffff',
    fontSize: 18,
    letterSpacing: 1,
  },
  planPrice: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#ffffff',
    fontSize: 32,
  },
  planCadence: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
  },
  planBlurb: {
    fontFamily: 'Inter_500Medium',
    color: '#ffffff',
    marginTop: 4,
  },
  planPerks: {
    marginTop: 12,
    gap: 8,
  },
  planPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planPerkText: {
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    fontSize: 13,
  },
  trustBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingVertical: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontFamily: 'Inter_500Medium',
    color: '#ffffff',
    fontSize: 12,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    height: 32,
    width: 120,
  },
  successRingWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successRingOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    padding: 12,
  },
  successRingInner: {
    flex: 1,
    borderRadius: 88,
    backgroundColor: 'rgba(12,14,26,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  metricCardValue: {
    fontFamily: 'Outfit_700Bold',
    color: '#ffffff',
    fontSize: 20,
  },
  metricCardLabel: {
    fontFamily: 'Inter_400Regular',
    color: COLOR.textMuted,
    fontSize: 12,
  },
  liveLogCard: {
    marginTop: 24,
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
  dashboardActions: {
    gap: 16,
  },
  restartLink: {
    alignSelf: 'center',
  },
  restartText: {
    fontFamily: 'Inter_500Medium',
    color: '#8B93B6',
    textDecorationLine: 'underline',
  },
});

