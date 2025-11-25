import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Input, Button, Card, CardContent, Logo, Alert as UIAlert } from '@/components/ui';

export function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp, loading } = useAuthStore();

  const handleSignUp = async () => {
    setError('');
    setSuccess(false);

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

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <ScrollView className="flex-1 bg-white dark:bg-slate-900">
        <View className="flex-1 p-6 pt-20">
          <View className="items-center mb-12">
            <Logo size="md" />
          </View>

          <Card variant="elevated">
            <CardContent className="p-6">
              <UIAlert variant="success" title="Check Your Email">
                We&apos;ve sent you a confirmation email. Please check your inbox and click the link to verify your
                account.
              </UIAlert>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.push('/auth/login' as any)}
                className="mt-6"
              >
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
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
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
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
