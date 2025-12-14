import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { initializeSuperwall } from '@/lib/superwall';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize Superwall when user is authenticated
  useEffect(() => {
    if (user?.id) {
      initializeSuperwall(user.id, user.email).catch((error) => {
        console.error('Failed to initialize Superwall:', error);
      });
    }
  }, [user?.id, user?.email]);

  return <>{children}</>;
}
