import React, { useState } from 'react';
import { View, Text, ScrollView, Alert as RNAlert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { Button, Card, CardHeader, CardContent, Badge, Alert, Input } from '@/components/ui';

export function ProfileScreen() {
  const { user, signOut, updatePassword, loading } = useAuthStore();
  const { isDark, toggleColorScheme } = useThemeStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignOut = async () => {
    RNAlert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login' as any);
          },
        },
      ]
    );
  };

  const handlePasswordChange = async () => {
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const { error: updateError } = await updatePassword(newPassword);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900">
      <View className="p-6 pt-12">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2">
            Manage your account settings
          </Text>
        </View>

        {/* Success/Error Alerts */}
        {success ? (
          <View className="mb-6">
            <Alert variant="success">{success}</Alert>
          </View>
        ) : null}

        {error ? (
          <View className="mb-6">
            <Alert variant="danger">{error}</Alert>
          </View>
        ) : null}

        {/* Account Info Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Account Information
            </Text>
          </CardHeader>
          <CardContent>
            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Email
                </Text>
                <Text className="text-base text-gray-900 dark:text-white">
                  {user?.email}
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Account Status
                </Text>
                <View className="flex-row">
                  <Badge variant={user?.email_confirmed_at ? 'success' : 'warning'}>
                    {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
                  </Badge>
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  User ID
                </Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {user?.id}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Security
            </Text>
          </CardHeader>
          <CardContent>
            {showPasswordChange ? (
              <View className="gap-4">
                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secure
                  helperText="Must be at least 8 characters"
                />
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secure
                />
                <View className="flex-row gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onPress={handlePasswordChange}
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onPress={() => {
                      setShowPasswordChange(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </View>
              </View>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onPress={() => setShowPasswordChange(true)}
              >
                Change Password
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Preferences
            </Text>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-gray-900 dark:text-white">
                  Dark Mode
                </Text>
                <Button
                  variant={isDark ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={toggleColorScheme}
                >
                  {isDark ? 'On' : 'Off'}
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button
          variant="danger"
          size="lg"
          fullWidth
          onPress={handleSignOut}
          disabled={loading}
        >
          Sign Out
        </Button>

        {/* App Info */}
        <View className="mt-8 mb-4">
          <Text className="text-xs text-center text-gray-400 dark:text-gray-500">
            ZeroTrace Labs v1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
