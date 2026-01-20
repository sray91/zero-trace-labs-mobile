import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Input, Button, Card, CardContent, Logo, Alert as UIAlert } from '@/components/ui';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const { signIn, isLoaded } = useSignIn();

  const handleSendCode = async () => {
    if (!isLoaded) return;

    setError('');
    setSuccessMessage(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await signIn?.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setSuccessMessage(true);
      setPendingReset(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to send reset code');
    }
  };

  const handleResetPassword = async () => {
    if (!isLoaded) return;

    setError('');

    if (!code || !password) {
      setError('Please enter the code and your new password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result?.status === 'complete') {
        // Password reset successful, navigate to login
        router.replace('/auth/login' as any);
      } else {
        setError('Password reset failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Password reset failed');
    }
  };

  if (pendingReset) {
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
          <View className="items-center mb-12">
            <Logo size="md" />
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6">
              Reset Your Password
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center px-6">
              Enter the verification code sent to {email} and your new password
            </Text>
          </View>

          {error ? (
            <View className="mb-6">
              <UIAlert variant="danger" title="Error">
                {error}
              </UIAlert>
            </View>
          ) : null}

          <Card variant="elevated" className="mb-6">
            <CardContent className="p-6">
              <View className="gap-4">
                <Input
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
                <Input
                  label="New Password"
                  placeholder="Enter your new password"
                  value={password}
                  onChangeText={setPassword}
                  secure
                  helperText="Must be at least 8 characters"
                />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleResetPassword}
                  disabled={!isLoaded}
                >
                  Reset Password
                </Button>
              </View>
            </CardContent>
          </Card>

          <TouchableOpacity
            onPress={() => setPendingReset(false)}
            className="self-center"
          >
            <Text className="text-base text-gray-600 dark:text-gray-400">
              Go back
            </Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            Reset Password
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center px-6">
            Enter your email address and we&apos;ll send you a verification code
          </Text>
        </View>

        {/* Success Alert */}
        {successMessage ? (
          <View className="mb-6">
            <UIAlert variant="success" title="Code Sent">
              Check your email for the verification code.
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
                onPress={handleSendCode}
                disabled={!isLoaded || successMessage}
              >
                {!isLoaded ? 'Loading...' : 'Send Verification Code'}
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
    </KeyboardAvoidingView>
  );
}
