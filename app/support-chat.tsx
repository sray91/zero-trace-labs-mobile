import { api } from '@/convex/_generated/api';
import {
  AI_DATA_NOT_SENT,
  AI_DATA_SENT,
  AI_DISCLOSURE_FOOTER,
  AI_DISCLOSURE_INTRO,
  AI_PRODUCT,
  AI_PROVIDER,
  PRIVACY_POLICY_URL,
} from '@/lib/legal';
import { COLOR } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const GREETING_TEXT =
  "Hi! I'm the 0TraceLabs assistant. Ask me anything about scans, removals, or your account — or tap \"Talk to a human\" and our team will jump in.";

const HUMAN_GREETING_TEXT =
  'Send us a message and our support team will get back to you here. You can turn the AI assistant on in Settings if you\'d like instant answers.';

type ChatMessage = {
  _id: string;
  role: string;
  text: string;
  authorName?: string;
};

type ListItem =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'typing' };

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return <Text style={styles.systemText}>{message.text}</Text>;
  }

  return (
    <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleOther]}>
        {!isUser && (
          <View style={styles.authorRow}>
            <Ionicons
              name={message.role === 'bot' ? 'sparkles' : 'headset'}
              size={11}
              color={COLOR.textMuted}
            />
            <Text style={styles.authorText}>
              {message.role === 'bot' ? 'Assistant' : message.authorName || 'Support'}
            </Text>
          </View>
        )}
        <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextOther}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

/** Shown before the first message can reach the AI service. Nothing the user types
 *  is sent anywhere until they choose one of the two buttons — declining routes the
 *  conversation to a human instead. (App Store Guidelines 5.1.1(i) / 5.1.2(i).) */
function AiDisclosure({
  onAccept,
  onDecline,
  busy,
}: {
  onAccept: () => void;
  onDecline: () => void;
  busy: boolean;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.disclosureContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.disclosureIcon}>
        <Ionicons name="sparkles" size={24} color={COLOR.nuclearStart} />
      </View>

      <Text style={styles.disclosureTitle}>Before we start</Text>
      <Text style={styles.disclosureIntro}>{AI_DISCLOSURE_INTRO}</Text>

      <View style={styles.disclosureCard}>
        <Text style={styles.disclosureCardTitle}>What we send to {AI_PROVIDER}</Text>
        {AI_DATA_SENT.map((item) => (
          <View key={item} style={styles.disclosureItem}>
            <Ionicons name="arrow-up-circle" size={15} color={COLOR.nuclearStart} />
            <Text style={styles.disclosureItemText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.disclosureCard}>
        <Text style={styles.disclosureCardTitle}>What we never send</Text>
        {AI_DATA_NOT_SENT.map((item) => (
          <View key={item} style={styles.disclosureItem}>
            <Ionicons name="close-circle" size={15} color={COLOR.textMuted} />
            <Text style={styles.disclosureItemText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.disclosureFooter}>{AI_DISCLOSURE_FOOTER}</Text>

      <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
        <Text style={styles.disclosureLink}>Read our Privacy Policy</Text>
      </Pressable>

      <Pressable
        style={[styles.primaryButton, busy && styles.buttonDisabled]}
        onPress={onAccept}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Agree and chat with the ${AI_PRODUCT} assistant`}
      >
        {busy ? (
          <ActivityIndicator size="small" color={COLOR.deepVoid} />
        ) : (
          <Text style={styles.primaryButtonText}>AGREE AND CONTINUE</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={onDecline}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Decline and chat with our team instead"
      >
        <Text style={styles.secondaryButtonText}>Chat with our team instead</Text>
      </Pressable>
    </ScrollView>
  );
}

export default function SupportChatScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const data = useQuery(api.support.forCurrentUser, isAuthenticated ? {} : 'skip');
  const sendMessage = useMutation(api.support.sendMessage);
  const requestHuman = useMutation(api.support.requestHuman);
  const setAiConsent = useMutation(api.support.setAiConsent);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  const showError = (message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 4000);
  };

  const messages = useMemo<ChatMessage[]>(() => data?.messages ?? [], [data]);
  const aiConsent = data?.aiConsent ?? 'unset';
  // Until the user has answered the disclosure, no message box is shown at all.
  const needsConsent = aiConsent === 'unset';
  const status = data?.conversation?.status ?? (aiConsent === 'granted' ? 'bot' : 'human');
  const isBot = status === 'bot';
  const waitingOnBot =
    isBot && messages.length > 0 && messages[messages.length - 1].role === 'user';

  // Inverted list: newest first, greeting last (renders at the top of the chat).
  const listItems = useMemo<ListItem[]>(() => {
    const greeting = isBot ? GREETING_TEXT : HUMAN_GREETING_TEXT;
    const items: ListItem[] = [
      {
        kind: 'message',
        message: { _id: 'greeting', role: isBot ? 'bot' : 'agent', text: greeting },
      },
      ...messages.map((m: ChatMessage): ListItem => ({ kind: 'message', message: m })),
    ];
    if (waitingOnBot) items.push({ kind: 'typing' });
    return items.reverse();
  }, [messages, waitingOnBot, isBot]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      await sendMessage({ text });
    } catch {
      setDraft(text);
      showError("Couldn't send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleConsent = async (granted: boolean) => {
    setSavingConsent(true);
    try {
      await setAiConsent({ granted });
    } catch {
      showError("Couldn't save your choice. Please try again.");
    } finally {
      setSavingConsent(false);
    }
  };

  const handleRequestHuman = async () => {
    try {
      await requestHuman();
    } catch {
      showError('Something went wrong. Please try again.');
    }
  };

  const signedOut = !authLoading && !isAuthenticated;
  const loading = !signedOut && (authLoading || data === undefined);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View pointerEvents="none" style={styles.backgroundGlow}>
        <LinearGradient
          colors={['rgba(0,212,255,0.25)', 'transparent']}
          style={styles.backgroundGradient}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
          <Ionicons name="chevron-back" size={18} color={COLOR.nuclearStart} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Support</Text>
          <Text style={styles.subtitle}>
            {status === 'human' ? 'Connected to our team' : 'Ask us anything about 0TraceLabs'}
          </Text>
        </View>
        {isBot && !needsConsent ? (
          <Pressable onPress={handleRequestHuman} hitSlop={8} style={styles.humanButton}>
            <Ionicons name="headset" size={13} color={COLOR.nuclearStart} />
            <Text style={styles.humanButtonText}>Talk to a human</Text>
          </Pressable>
        ) : (
          <View style={styles.humanButtonSpacer} />
        )}
      </View>

      {signedOut ? (
        <View style={styles.centerFill}>
          <Ionicons name="lock-closed" size={28} color={COLOR.textMuted} />
          <Text style={styles.signedOutText}>Sign in to chat with support.</Text>
          <Pressable
            style={styles.signInButton}
            onPress={() => router.replace('/auth/login' as any)}
          >
            <Text style={styles.signInButtonText}>SIGN IN</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={COLOR.nuclearStart} />
        </View>
      ) : needsConsent ? (
        <AiDisclosure
          onAccept={() => handleConsent(true)}
          onDecline={() => handleConsent(false)}
          busy={savingConsent}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            inverted
            data={listItems}
            keyExtractor={(item, index) =>
              item.kind === 'typing' ? 'typing' : item.message._id + index
            }
            renderItem={({ item }) =>
              item.kind === 'typing' ? (
                <View style={[styles.bubbleRow, styles.rowLeft]}>
                  <View style={[styles.bubble, styles.bubbleOther]}>
                    <Text style={styles.typingText}>Typing…</Text>
                  </View>
                </View>
              ) : (
                <MessageBubble message={item.message} />
              )
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          {isBot && (
            <Text style={styles.aiNotice}>
              Replies are generated by {AI_PRODUCT} ({AI_PROVIDER}) from the messages in
              this chat. Turn this off in Settings.
            </Text>
          )}

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message…"
              placeholderTextColor={COLOR.textMuted}
              multiline
              maxLength={4000}
              editable={!sending}
            />
            <Pressable
              onPress={handleSend}
              disabled={!draft.trim() || sending}
              style={[
                styles.sendButton,
                (!draft.trim() || sending) && styles.sendButtonDisabled,
              ]}
              hitSlop={8}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLOR.deepVoid} />
              ) : (
                <Ionicons name="arrow-up" size={18} color={COLOR.deepVoid} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOR.deepVoid },
  backgroundGlow: { position: 'absolute', top: -120, left: -60, right: -60, height: 360 },
  backgroundGradient: { flex: 1, borderRadius: 999, opacity: 0.6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLOR.nuclearStart,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: COLOR.white },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLOR.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  humanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 70,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  humanButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: COLOR.nuclearStart,
    textAlign: 'right',
  },
  humanButtonSpacer: { width: 70 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  signedOutText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: COLOR.textMuted },
  signInButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLOR.nuclearStart,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  signInButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    color: COLOR.nuclearStart,
    letterSpacing: 1,
    fontSize: 13,
  },
  chatArea: { flex: 1 },

  // ---- AI disclosure gate ----
  disclosureContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  disclosureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.glassBg,
    borderWidth: 1,
    borderColor: COLOR.glassBorder,
    marginBottom: 14,
  },
  disclosureTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 22,
    color: COLOR.white,
    marginBottom: 8,
  },
  disclosureIntro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: COLOR.textMuted,
    marginBottom: 18,
  },
  disclosureCard: {
    backgroundColor: COLOR.glassBg,
    borderColor: COLOR.glassBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    gap: 9,
  },
  disclosureCardTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: COLOR.white,
  },
  disclosureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  disclosureItemText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: COLOR.textMuted,
  },
  disclosureFooter: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: COLOR.textMuted,
    marginTop: 6,
  },
  disclosureLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLOR.nuclearStart,
    marginTop: 12,
    marginBottom: 22,
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: COLOR.nuclearStart,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    letterSpacing: 1,
    color: COLOR.deepVoid,
  },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: { paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLOR.nuclearStart,
  },
  aiNotice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: COLOR.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  listContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  bubbleRow: { flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleUser: {
    backgroundColor: COLOR.nuclearEnd,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: COLOR.glassBg,
    borderWidth: 1,
    borderColor: COLOR.hairline,
    borderBottomLeftRadius: 6,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  authorText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: COLOR.textMuted },
  bubbleTextUser: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLOR.white,
  },
  bubbleTextOther: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLOR.white,
  },
  systemText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: COLOR.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  typingText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: COLOR.textMuted },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR.danger,
    backgroundColor: 'rgba(255, 84, 112, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: COLOR.danger },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR.glassBorder,
    backgroundColor: COLOR.glassBg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLOR.white,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLOR.nuclearStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
