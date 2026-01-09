import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import React from 'react';
import { create } from 'zustand';
import { useSubscriptionStore } from './subscription-store';

interface AuthState {
  user: any | null;
  loading: boolean;
  initialized: boolean;
  isSignedIn: boolean;
}

// Zustand store that will be synced with Clerk state
export const useAuthStore = create<AuthState>(() => ({
  user: null,
  loading: true,
  initialized: false,
  isSignedIn: false,
}));

// Custom hook that combines Clerk hooks with our store
export function useClerkAuth() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  // Sync Clerk state to our Zustand store
  React.useEffect(() => {
    useAuthStore.setState({
      user: user,
      loading: !isLoaded,
      initialized: isLoaded,
      isSignedIn: !!isSignedIn,
    });
  }, [isLoaded, isSignedIn, user]);

  const signOut = async () => {
    // Clean up subscription store
    useSubscriptionStore.getState().reset();

    // Sign out from Clerk
    await clerkSignOut();
  };

  return {
    user,
    loading: !isLoaded,
    initialized: isLoaded,
    isSignedIn: !!isSignedIn,
    userId,
    signOut,
  };
}
