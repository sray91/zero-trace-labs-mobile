import React from 'react';
import { View, ViewProps } from 'react-native';
import { Image } from 'expo-image';
import { cn } from '@/lib/utils/cn';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LogoProps extends ViewProps {
  size?: LogoSize;
  /**
   * Custom width and height in pixels
   * If provided, overrides the size prop
   */
  width?: number;
  height?: number;
}

const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 80, height: 80 },
  sm: { width: 120, height: 120 },
  md: { width: 160, height: 160 },
  lg: { width: 200, height: 200 },
  xl: { width: 280, height: 280 },
};

export function Logo({
  size = 'md',
  width,
  height,
  className,
  style,
  ...props
}: LogoProps) {
  const dimensions = width && height
    ? { width, height }
    : sizeMap[size];

  return (
    <View className={cn('items-center justify-center', className)} {...props}>
      <Image
        source={require('@/assets/images/main-logo.png')}
        style={[dimensions, style]}
        contentFit="contain"
        transition={200}
      />
    </View>
  );
}
