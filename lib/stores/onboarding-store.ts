import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  welcomeCompleted: boolean;
  loading: boolean;

  // Actions
  initialize: () => Promise<void>;
  completeWelcome: () => Promise<void>;
  resetWelcome: () => Promise<void>;
}

const STORAGE_KEY = '@0trace:welcome_completed';

export const useOnboardingStore = create<OnboardingState>((set) => ({
  welcomeCompleted: false,
  loading: true,

  initialize: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      set({
        welcomeCompleted: value === 'true',
        loading: false
      });
    } catch (error) {
      console.error('Error loading welcome status:', error);
      set({ loading: false });
    }
  },

  completeWelcome: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      set({ welcomeCompleted: true });
    } catch (error) {
      console.error('Error saving welcome status:', error);
    }
  },

  resetWelcome: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ welcomeCompleted: false });
    } catch (error) {
      console.error('Error resetting welcome status:', error);
    }
  },
}));
