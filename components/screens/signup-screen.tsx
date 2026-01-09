import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { Input, Button, Card, CardContent, Logo, Alert as UIAlert } from '@/components/ui';

export function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const { signUp, setActive, isLoaded } = useSignUp();

  const handleSignUp = async () => {
    if (!isLoaded) return;

    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'An error occurred during sign up');
    }
  };

  const handleVerifyEmail = async () => {
    if (!isLoaded) return;

    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Verification failed');
    }
  };

  if (pendingVerification) {
    return (
      <ScrollView className="flex-1 bg-white dark:bg-slate-900">
        <View className="flex-1 p-6 pt-20">
          <View className="items-center mb-12">
            <Logo size="md" />
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6">
              Verify Your Email
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center">
              We&apos;ve sent a verification code to {email}
            </Text>
          </View>

          {error ? (
            <View className="mb-6">
              <UIAlert variant="danger" title="Verification Error">
                {error}
              </UIAlert>
            </View>
          ) : null}

          <Card variant="elevated">
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

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleVerifyEmail}
                  disabled={!isLoaded || !code}
                >
                  Verify Email
                </Button>
              </View>
            </CardContent>
          </Card>

          <TouchableOpacity
            onPress={() => setPendingVerification(false)}
            className="mt-6 self-center"
          >
            <Text className="text-base text-gray-600 dark:text-gray-400">
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 p-6 pt-20">
        {/* Logo and Header */}
        <View className="items-center mb-12">
          <Logo size="md" />
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6">
            Create Account
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center">
            Sign up to get started with ZeroTrace Labs
          </Text>
        </View>

        {/* Error Alert */}
        {error ? (
          <View className="mb-6">
            <UIAlert variant="danger" title="Sign Up Error">
              {error}
            </UIAlert>
          </View>
        ) : null}

        {/* Sign Up Form */}
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
                helperText="Must be at least 8 characters"
              />
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secure
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSignUp}
                disabled={!isLoaded}
              >
                {!isLoaded ? 'Loading...' : 'Create Account'}
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-base text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
            <Text className="text-base font-semibold text-primary-600 dark:text-primary-400">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
