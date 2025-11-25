import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends ViewProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-info-50 dark:bg-info-950/50 border-info-200 dark:border-info-800',
  success: 'bg-success-50 dark:bg-success-950/50 border-success-200 dark:border-success-800',
  warning: 'bg-warning-50 dark:bg-warning-950/50 border-warning-200 dark:border-warning-800',
  danger: 'bg-danger-50 dark:bg-danger-950/50 border-danger-200 dark:border-danger-800',
};

const titleTextClasses: Record<AlertVariant, string> = {
  info: 'text-info-900 dark:text-info-100',
  success: 'text-success-900 dark:text-success-100',
  warning: 'text-warning-900 dark:text-warning-100',
  danger: 'text-danger-900 dark:text-danger-100',
};

const contentTextClasses: Record<AlertVariant, string> = {
  info: 'text-info-800 dark:text-info-200',
  success: 'text-success-800 dark:text-success-200',
  warning: 'text-warning-800 dark:text-warning-200',
  danger: 'text-danger-800 dark:text-danger-200',
};

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  className,
  ...props
}: AlertProps) {
  return (
    <View
      className={cn(
        'rounded-xl p-4 border-2',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <View className="flex-row items-start">
        {icon && <View className="mr-3 mt-0.5">{icon}</View>}

        <View className="flex-1">
          {title && (
            <Text
              className={cn(
                'text-base font-semibold mb-1',
                titleTextClasses[variant]
              )}
            >
              {title}
            </Text>
          )}

          <Text
            className={cn(
              'text-sm leading-relaxed',
              contentTextClasses[variant]
            )}
          >
            {children}
          </Text>
        </View>
      </View>
    </View>
  );
}
