import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme } from '../constants/colors';

interface ThemeState {
  colorScheme: ColorScheme;
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      colorScheme: 'dark', // Default to dark mode for security app
      isDark: true,

      setColorScheme: (scheme: ColorScheme) =>
        set({ colorScheme: scheme, isDark: scheme === 'dark' }),

      toggleColorScheme: () => {
        const newScheme = get().isDark ? 'light' : 'dark';
        set({ colorScheme: newScheme, isDark: newScheme === 'dark' });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
