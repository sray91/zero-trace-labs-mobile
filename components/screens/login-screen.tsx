import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Input, Button, Card, CardContent, Logo, Alert as UIAlert } from '@/components/ui';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, setActive, isLoaded } = useSignIn();

  const handleLogin = async () => {
    if (!isLoaded) return;

    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'An error occurred during sign in');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-white dark:bg-slate-900"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 p-6 pt-20">
        {/* Logo and Header */}
        <View className="items-center mb-12">
          <Logo size="md" />
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6">
            Welcome Back
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center">
            Sign in to your account to continue
          </Text>
        </View>

        {/* Error Alert */}
        {error ? (
          <View className="mb-6">
            <UIAlert variant="danger" title="Sign In Error">
              {error}
            </UIAlert>
          </View>
        ) : null}

        {/* Login Form */}
        <Card variant="elevated" className="mb-6">
          <CardContent className="p-6">
            <View className="gap-4">
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
              />

              <TouchableOpacity
                onPress={() => router.push('/auth/forgot-password' as any)}
                className="self-end"
              >
                <Text className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleLogin}
                disabled={!isLoaded}
              >
                {!isLoaded ? 'Loading...' : 'Sign In'}
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-base text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup' as any)}>
            <Text className="text-base font-semibold text-primary-600 dark:text-primary-400">
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
