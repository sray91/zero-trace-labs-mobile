import { create } from 'zustand';
import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'trialing'
  | 'past_due'
  | null;

export interface Customer {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  phone: string | null;
  whop_user_id: string | null;
  whop_membership_id: string | null;
  whop_plan_id: string;
  whop_checkout_session_id: string | null;
  subscription_status: SubscriptionStatus;
  plan_name: string;
  beehiiv_subscriber_id: string | null;
  beehiiv_subscribed_at: string | null;
  beehiiv_status: string | null;
  has_app_access: boolean;
  access_expires_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  notes: string | null;
  user_id: string | null;
}

interface SubscriptionState {
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
  realtimeChannel: RealtimeChannel | null;

  // Actions
  fetchCustomer: (userId: string) => Promise<void>;
  createCustomer: (data: Partial<Customer>) => Promise<void>;
  updateCustomer: (customerId: string, data: Partial<Customer>) => Promise<void>;
  subscribeToChanges: (userId: string) => void;
  unsubscribeFromChanges: () => void;
  hasActiveSubscription: () => boolean;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  customer: null,
  isLoading: false,
  error: null,
  realtimeChannel: null,

  fetchCustomer: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no customer found, that's okay - they might not have subscribed yet
        if (error.code === 'PGRST116') {
          set({ customer: null, isLoading: false });
          return;
        }
        throw error;
      }

      set({ customer: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching customer:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch customer',
        isLoading: false
      });
    }
  },

  createCustomer: async (data: Partial<Customer>) => {
    set({ isLoading: true, error: null });

    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      set({ customer, isLoading: false });
    } catch (error) {
      console.error('Error creating customer:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create customer',
        isLoading: false
      });
    }
  },

  updateCustomer: async (customerId: string, data: Partial<Customer>) => {
    set({ isLoading: true, error: null });

    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;

      set({ customer, isLoading: false });
    } catch (error) {
      console.error('Error updating customer:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update customer',
        isLoading: false
      });
    }
  },

  subscribeToChanges: (userId: string) => {
    // Unsubscribe from any existing channel first
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    // Subscribe to real-time changes for this user's customer record
    const channel = supabase
      .channel(`customer-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Customer record changed:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            set({ customer: payload.new as Customer });
          } else if (payload.eventType === 'DELETE') {
            set({ customer: null });
          }
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromChanges: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
  },

  hasActiveSubscription: () => {
    const { customer } = get();

    if (!customer) return false;

    // Check if has app access
    if (!customer.has_app_access) return false;

    // Check if subscription is active or trialing
    const validStatuses: SubscriptionStatus[] = ['active', 'trialing'];
    if (!validStatuses.includes(customer.subscription_status)) return false;

    // Check if access hasn't expired
    if (customer.access_expires_at) {
      const expiresAt = new Date(customer.access_expires_at);
      const now = new Date();
      if (now > expiresAt) return false;
    }

    return true;
  },

  reset: () => {
    const { unsubscribeFromChanges } = get();
    unsubscribeFromChanges();
    set({
      customer: null,
      isLoading: false,
      error: null,
      realtimeChannel: null
    });
  },
}));
