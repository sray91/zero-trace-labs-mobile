import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils/cn';

export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white dark:bg-slate-800',
  elevated: 'bg-white dark:bg-slate-800 shadow-lg',
  outlined: 'bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-gray-700',
};

export function Card({ variant = 'default', children, className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl p-4',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

// Card sub-components for better composition
export function CardHeader({ children, className, ...props }: ViewProps) {
  return (
    <View className={cn('mb-3', className)} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ children, className, ...props }: ViewProps) {
  return (
    <View className={cn('', className)} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className, ...props }: ViewProps) {
  return (
    <View className={cn('mt-3 pt-3 border-t border-gray-100 dark:border-gray-700', className)} {...props}>
      {children}
    </View>
  );
}
