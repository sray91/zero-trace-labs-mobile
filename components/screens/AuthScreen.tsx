import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Input, Logo, Alert } from '@/components/ui';

/**
 * Sample Authentication Screen
 * Demonstrates how to use the Logo component in a real screen
 * This is a template you can use for your actual auth implementation
 */
export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // Add your authentication logic here
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View className="items-center mb-12">
          <Logo size="lg" />
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6">
            Welcome Back
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center">
            Sign in to protect your digital identity
          </Text>
        </View>

        {/* Info Alert */}
        <Alert variant="info" className="mb-6">
          Your data is encrypted end-to-end and never leaves your device unprotected.
        </Alert>

        {/* Form */}
        <View className="gap-4 mb-6">
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secure
            autoComplete="password"
          />
        </View>

        {/* Actions */}
        <View className="gap-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleLogin}
          >
            Sign In
          </Button>

          <Button variant="ghost" size="lg" fullWidth>
            Create Account
          </Button>
        </View>

        {/* Footer */}
        <View className="mt-8">
          <Text className="text-sm text-center text-gray-500 dark:text-gray-400">
            Protected by end-to-end encryption
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
