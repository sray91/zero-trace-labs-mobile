import { AuthError, Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../supabase';
import { useSubscriptionStore } from './subscription-store';
import { superwallService } from '../superwall';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (data: { email?: string; data?: Record<string, any> }) => Promise<{ error: AuthError | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  setSession: (session: Session | null) => {
    set({
      session,
      user: session?.user ?? null,
    });
  },

  initialize: async () => {
    try {
      set({ loading: true });

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        initialized: true,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        get().setSession(session);
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    set({ loading: false });
    return { error };
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    set({ loading: false });
    return { error };
  },

  signOut: async () => {
    set({ loading: true });

    // Clean up subscription store
    useSubscriptionStore.getState().reset();

    // Reset Superwall user
    await superwallService.reset();

    // Sign out from Supabase
    await supabase.auth.signOut();

    set({ session: null, user: null, loading: false });
  },

  resetPassword: async (email: string) => {
    set({ loading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'zerotracelabsmobile://reset-password',
    });
    set({ loading: false });
    return { error };
  },

  updatePassword: async (newPassword: string) => {
    set({ loading: true });
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    set({ loading: false });
    return { error };
  },

  updateProfile: async (data: { email?: string; data?: Record<string, any> }) => {
    set({ loading: true });
    const { error } = await supabase.auth.updateUser(data);
    set({ loading: false });
    return { error };
  },
}));
