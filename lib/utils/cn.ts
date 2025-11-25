/**
 * Utility function to merge class names
 * Similar to clsx/classnames but optimized for NativeWind
 */

type ClassValue = string | undefined | null | false;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
