import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Check if we're in a browser environment (not SSR/Node.js)
const isBrowser = typeof window !== 'undefined';

// Secure storage adapter for auth tokens
// Uses SecureStore on native platforms, AsyncStorage on web, and no-op during SSR
const SecureStorageAdapter = {
  getItem: async (key: string) => {
    // During SSR, return null (no session)
    if (!isBrowser && Platform.OS === 'web') {
      return null;
    }
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    // During SSR, no-op
    if (!isBrowser && Platform.OS === 'web') {
      return;
    }
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    // During SSR, no-op
    if (!isBrowser && Platform.OS === 'web') {
      return;
    }
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
