import { api } from '@/convex/_generated/api';
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
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const GREETING_TEXT =
  "Hi! I'm the 0TraceLabs assistant. Ask me anything about scans, removals, or your account — or tap \"Talk to a human\" and our team will jump in.";

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

export default function SupportChatScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const data = useQuery(api.support.forCurrentUser, isAuthenticated ? {} : 'skip');
  const sendMessage = useMutation(api.support.sendMessage);
  const requestHuman = useMutation(api.support.requestHuman);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
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
  const status = data?.conversation?.status ?? 'bot';
  const isBot = status === 'bot';
  const waitingOnBot =
    isBot && messages.length > 0 && messages[messages.length - 1].role === 'user';

  // Inverted list: newest first, greeting last (renders at the top of the chat).
  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [
      { kind: 'message', message: { _id: 'greeting', role: 'bot', text: GREETING_TEXT } },
      ...messages.map((m: ChatMessage): ListItem => ({ kind: 'message', message: m })),
    ];
    if (waitingOnBot) items.push({ kind: 'typing' });
    return items.reverse();
  }, [messages, waitingOnBot]);

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

  const handleRequestHuman = async () => {
    try {
      await requestHuman();
    } catch {
      showError('Something went wrong. Please try again.');
    }
  };

  const signedOut = !authLoading && !isAuthenticated;
  const loading = !signedOut && (authLoading || data === undefined || data === null);

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
        {isBot ? (
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
