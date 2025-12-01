# ZeroTrace Labs Design System

## Logo Component

The `Logo` component provides a consistent way to display your brand logo throughout the app.

### Basic Usage

```tsx
import { Logo } from '@/components/ui';

function MyScreen() {
  return <Logo size="md" />;
}
```

### Sizes

The Logo component comes with 5 predefined sizes:

```tsx
<Logo size="xs" />  // 80x80px
<Logo size="sm" />  // 120x120px
<Logo size="md" />  // 160x160px (default)
<Logo size="lg" />  // 200x200px
<Logo size="xl" />  // 280x280px
```

### Custom Dimensions

For complete control, you can specify custom width and height:

```tsx
<Logo width={100} height={100} />
```

### Styling

The Logo component accepts standard View props for additional styling:

```tsx
<Logo
  size="md"
  className="mb-8"
  style={{ opacity: 0.8 }}
/>
```

### Common Use Cases

#### 1. Authentication Screens
```tsx
<View className="items-center mb-12">
  <Logo size="lg" />
  <Text className="text-3xl font-bold mt-6">
    Welcome Back
  </Text>
</View>
```

#### 2. Header/Navigation
```tsx
<View className="flex-row items-center p-4">
  <Logo size="xs" />
  <Text className="ml-3 text-xl font-semibold">
    ZeroTrace Labs
  </Text>
</View>
```

#### 3. Splash Screen
```tsx
<View className="flex-1 items-center justify-center">
  <Logo size="xl" />
</View>
```

#### 4. Empty States
```tsx
<View className="items-center p-8">
  <Logo size="sm" className="opacity-30" />
  <Text className="mt-4 text-gray-500">
    No breaches found
  </Text>
</View>
```

## Component Library

### Buttons
- **Variants**: primary, secondary, danger, ghost, outline
- **Sizes**: sm, md, lg
- **Features**: Loading states, full width, accessibility

### Inputs
- **Features**: Labels, errors, helper text, secure entry
- **Types**: Text, email, password, etc.
- **State**: Focus states, error states

### Cards
- **Variants**: default, elevated, outlined
- **Composition**: CardHeader, CardContent, CardFooter
- **Use Cases**: Breach details, data broker info, security scores

### Badges
- **Variants**: default, success, warning, danger, info, secondary
- **Specialized**: SeverityBadge for breach severity levels
- **Sizes**: sm, md, lg

### Alerts
- **Variants**: info, success, warning, danger
- **Features**: Optional title, icon support
- **Use Cases**: Breach notifications, status updates

## Theme Management

The app uses Zustand for theme management with persistent storage:

```tsx
import { useThemeStore } from '@/lib/stores/theme-store';

function MyComponent() {
  const { isDark, colorScheme, toggleColorScheme } = useThemeStore();

  return (
    <Button onPress={toggleColorScheme}>
      Toggle {isDark ? 'Light' : 'Dark'} Mode
    </Button>
  );
}
```

## Color System

The design system uses a security-focused color palette:

- **Primary (Blue)**: Trust and security
- **Secondary (Purple)**: Premium and secure
- **Success (Green)**: Secure/protected status
- **Warning (Amber)**: Attention needed
- **Danger (Red)**: Breach/critical issues
- **Info (Cyan)**: Informational messages

### Severity Colors

Special colors for breach severity ratings:
- **Critical**: Red 600 (#dc2626)
- **High**: Amber 500 (#f59e0b)
- **Medium**: Yellow 500 (#eab308)
- **Low**: Green 500 (#22c55e)
- **Info**: Cyan 500 (#06b6d4)

## File Locations

```
components/
├── ui/
│   ├── Logo.tsx          # Logo component
│   ├── Button.tsx        # Button component
│   ├── Input.tsx         # Input component
│   ├── Card.tsx          # Card component
│   ├── Badge.tsx         # Badge component
│   ├── Alert.tsx         # Alert component
│   └── index.ts          # Barrel export
├── screens/
│   └── AuthScreen.tsx    # Sample auth screen
lib/
├── constants/
│   ├── colors.ts         # Color tokens
│   ├── typography.ts     # Typography system
│   └── spacing.ts        # Spacing and shadows
├── stores/
│   └── theme-store.ts    # Theme management
└── utils/
    └── cn.ts             # Class name utility
```

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Prefer composition** - use Card + CardHeader + CardContent
3. **Support dark mode** - all custom components should support both themes
4. **Use semantic colors** - danger for breaches, success for secured
5. **Maintain consistency** - use the Logo component everywhere
6. **Accessibility first** - all interactive elements support screen readers

## Next Steps

- [ ] Set up Supabase authentication
- [ ] Create breach monitoring screens
- [ ] Build data broker directory
- [ ] Implement remediation tracker
- [ ] Add biometric authentication
- [ ] Set up push notifications
