import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secure?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secure = false,
  containerClassName,
  className,
  ...props
}: InputProps) {
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;

  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </Text>
      )}

      <View
        className={cn(
          'flex-row items-center px-4 py-3 rounded-xl border-2',
          'bg-white dark:bg-slate-800',
          hasError
            ? 'border-danger-500'
            : isFocused
            ? 'border-primary-500'
            : 'border-gray-200 dark:border-gray-700'
        )}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}

        <TextInput
          className={cn(
            'flex-1 text-base',
            'text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            className
          )}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secure && !isSecureVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {secure && (
          <TouchableOpacity
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            className="ml-2"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
          >
            <Text className="text-sm text-primary-600 dark:text-primary-400">
              {isSecureVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secure && <View className="ml-2">{rightIcon}</View>}
      </View>

      {(error || helperText) && (
        <Text
          className={cn(
            'text-sm mt-1.5',
            hasError
              ? 'text-danger-600 dark:text-danger-400'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}
