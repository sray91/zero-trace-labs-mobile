import { useClerkAuth } from '@/lib/stores/auth-store';
import React from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isSignedIn } = useClerkAuth();

  return <>{children}</>;
}
