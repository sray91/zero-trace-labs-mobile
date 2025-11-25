/**
 * Typography Design System
 * Using system fonts for optimal performance and native feel
 */

export const typography = {
  // Font Families
  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    mono: 'Courier', // For displaying sensitive data like emails, SSNs
  },

  // Font Sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line Heights
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// Tailwind class mappings for NativeWind
export const typographyClasses = {
  // Display
  'display-large': 'text-5xl font-bold leading-tight',
  'display-medium': 'text-4xl font-bold leading-tight',
  'display-small': 'text-3xl font-bold leading-tight',

  // Headings
  'heading-1': 'text-3xl font-bold leading-tight',
  'heading-2': 'text-2xl font-bold leading-tight',
  'heading-3': 'text-xl font-semibold leading-normal',
  'heading-4': 'text-lg font-semibold leading-normal',
  'heading-5': 'text-base font-semibold leading-normal',
  'heading-6': 'text-sm font-semibold leading-normal',

  // Body
  'body-large': 'text-lg font-normal leading-relaxed',
  'body-base': 'text-base font-normal leading-normal',
  'body-small': 'text-sm font-normal leading-normal',
  'body-xs': 'text-xs font-normal leading-normal',

  // Labels
  'label-large': 'text-base font-medium leading-normal',
  'label-medium': 'text-sm font-medium leading-normal',
  'label-small': 'text-xs font-medium leading-normal',

  // Monospace (for sensitive data)
  'mono-large': 'text-lg font-mono leading-normal',
  'mono-base': 'text-base font-mono leading-normal',
  'mono-small': 'text-sm font-mono leading-normal',
} as const;
