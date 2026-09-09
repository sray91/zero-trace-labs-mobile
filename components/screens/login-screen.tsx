import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Input, Button, Card, CardContent, Logo, Alert as UIAlert } from '@/components/ui';
import { clerkErrorMessage } from '@/lib/clerk-errors';

type SecondFactorStrategy = 'totp' | 'phone_code' | 'email_code';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | 'second_factor'>('credentials');
  const [code, setCode] = useState('');
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<SecondFactorStrategy>('totp');
  const { signIn, setActive, isLoaded } = useSignIn();

  const handleLogin = async () => {
    if (!isLoaded) return;

    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else if (result.status === 'needs_second_factor') {
        // Instance-level two-step verification is OFF, so this status should
        // only appear for accounts with a leftover second-factor enrollment.
        // Log what Clerk is asking for so stale enrollments are diagnosable.
        console.warn(
          'Clerk returned needs_second_factor. supportedSecondFactors =',
          JSON.stringify(result.supportedSecondFactors)
        );
        const factors = result.supportedSecondFactors ?? [];
        const totpFactor = factors.find((f) => f.strategy === 'totp');
        const emailFactor = factors.find((f) => f.strategy === 'email_code');
        const phoneFactor = factors.find((f) => f.strategy === 'phone_code');
        if (totpFactor) {
          setSecondFactorStrategy('totp');
        } else if (emailFactor) {
          // Device-verification flow: Clerk asks unrecognized devices to confirm
          // the email address. Not in PrepareSecondFactorParams' types, but the
          // API accepts it — hence the cast.
          setSecondFactorStrategy('email_code');
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: (emailFactor as any).emailAddressId,
          } as any);
        } else if (phoneFactor) {
          setSecondFactorStrategy('phone_code');
          await signIn.prepareSecondFactor({ strategy: 'phone_code' });
        } else {
          setError(
            'Clerk requires a second factor but offers no way to provide one. ' +
            'Check this user in the Clerk dashboard for a stale 2FA enrollment.'
          );
          return;
        }
        setCode('');
        setStep('second_factor');
      } else if (result.status === 'needs_new_password') {
        setError('Your password must be reset. Use “Forgot Password?” to set a new one.');
      } else {
        setError(`Sign in could not be completed (status: ${result.status}).`);
      }
    } catch (err: any) {
      setError(clerkErrorMessage(err, 'An error occurred during sign in. Please try again.'));
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded) return;

    setError('');

    if (!code) {
      setError('Please enter your verification code');
      return;
    }

    try {
      // Cast: 'email_code' is accepted by the API for device verification but
      // missing from AttemptSecondFactorParams' strategy union.
      const result = await signIn.attemptSecondFactor({
        strategy: secondFactorStrategy,
        code: code.trim(),
      } as any);

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError(`Sign in could not be completed (status: ${result.status}).`);
      }
    } catch (err: any) {
      setError(clerkErrorMessage(err, 'Invalid verification code. Please try again.'));
    }
  };

  const handleBackToCredentials = () => {
    setError('');
    setCode('');
    setStep('credentials');
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
            {step === 'credentials' ? 'Welcome Back' : 'Two-Factor Authentication'}
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center">
            {step === 'credentials'
              ? 'Sign in to your account to continue'
              : secondFactorStrategy === 'totp'
                ? 'Enter the code from your authenticator app'
                : secondFactorStrategy === 'email_code'
                  ? 'Enter the code we emailed to you'
                  : 'Enter the code we sent to your phone'}
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
            {step === 'second_factor' ? (
              <View className="gap-4">
                <Input
                  label="Verification Code"
                  placeholder="123456"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoComplete="one-time-code"
                />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleVerifyCode}
                  disabled={!isLoaded}
                >
                  Verify
                </Button>

                <TouchableOpacity onPress={handleBackToCredentials} className="self-center">
                  <Text className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
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
            )}
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
