import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Input, Button, Card, CardContent, Logo, Alert as UIAlert } from '@/components/ui';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword, loading } = useAuthStore();

  const handleResetPassword = async () => {
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 p-6 pt-20">
        {/* Logo and Header */}
        <View className="items-center mb-12">
          <Logo size="md" />
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6">
            Reset Password
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center px-6">
            Enter your email address and we&apos;ll send you instructions to reset your password
          </Text>
        </View>

        {/* Success Alert */}
        {success ? (
          <View className="mb-6">
            <UIAlert variant="success" title="Check Your Email">
              If an account exists with this email, you will receive password reset instructions.
            </UIAlert>
          </View>
        ) : null}

        {/* Error Alert */}
        {error ? (
          <View className="mb-6">
            <UIAlert variant="danger" title="Error">
              {error}
            </UIAlert>
          </View>
        ) : null}

        {/* Reset Form */}
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

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleResetPassword}
                disabled={loading || success}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Back to Login Link */}
        <View className="flex-row justify-center items-center mt-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-base font-semibold text-primary-600 dark:text-primary-400">
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
