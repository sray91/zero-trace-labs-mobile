import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 dark:bg-gray-800',
  success: 'bg-success-100 dark:bg-success-900/30',
  warning: 'bg-warning-100 dark:bg-warning-900/30',
  danger: 'bg-danger-100 dark:bg-danger-900/30',
  info: 'bg-info-100 dark:bg-info-900/30',
  secondary: 'bg-secondary-100 dark:bg-secondary-900/30',
};

const textClasses: Record<BadgeVariant, string> = {
  default: 'text-gray-700 dark:text-gray-300',
  success: 'text-success-700 dark:text-success-400',
  warning: 'text-warning-700 dark:text-warning-400',
  danger: 'text-danger-700 dark:text-danger-400',
  info: 'text-info-700 dark:text-info-400',
  secondary: 'text-secondary-700 dark:text-secondary-400',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 rounded-md',
  md: 'px-2.5 py-1 rounded-lg',
  lg: 'px-3 py-1.5 rounded-lg',
};

const textSizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <View
      className={cn(
        'self-start items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <Text
        className={cn(
          'font-medium',
          textClasses[variant],
          textSizeClasses[size]
        )}
      >
        {children}
      </Text>
    </View>
  );
}

// Severity badge specifically for breach severity ratings
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface SeverityBadgeProps extends Omit<BadgeProps, 'variant'> {
  severity: SeverityLevel;
}

const severityVariantMap: Record<SeverityLevel, BadgeVariant> = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'success',
  info: 'info',
};

export function SeverityBadge({ severity, ...props }: SeverityBadgeProps) {
  return (
    <Badge variant={severityVariantMap[severity]} {...props}>
      {severity.toUpperCase()}
    </Badge>
  );
}
