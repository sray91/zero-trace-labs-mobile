import { Platform } from 'react-native';

// Only import Superwall on native platforms (iOS/Android)
// Web doesn't support native modules
const Superwall = Platform.OS !== 'web'
  ? require('@superwall/react-native-superwall').default
  : null;

const SUPERWALL_API_KEY = process.env.EXPO_PUBLIC_SUPERWALL_API_KEY || '';

export interface SuperwallConfig {
  apiKey: string;
  userId?: string;
  userAttributes?: Record<string, any>;
}

class SuperwallService {
  private initialized = false;

  private isSupported(): boolean {
    return Platform.OS !== 'web' && Superwall !== null;
  }

  async initialize(config: SuperwallConfig) {
    if (!this.isSupported()) {
      console.log('Superwall not supported on this platform');
      return;
    }

    if (this.initialized) {
      console.log('Superwall already initialized');
      return;
    }

    try {
      await Superwall.configure(config.apiKey, {
        // Optional configuration
        logging: {
          level: __DEV__ ? 'debug' : 'warn',
          scopes: new Set(['all']),
        },
      });

      // Set user identity if provided
      if (config.userId) {
        await this.identify(config.userId, config.userAttributes);
      }

      this.initialized = true;
      console.log('Superwall initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Superwall:', error);
      throw error;
    }
  }

  async identify(userId: string, attributes?: Record<string, any>) {
    if (!this.isSupported()) return;

    try {
      await Superwall.identify(userId);

      if (attributes) {
        await Superwall.setUserAttributes(attributes);
      }

      console.log('Superwall user identified:', userId);
    } catch (error) {
      console.error('Failed to identify Superwall user:', error);
    }
  }

  async setUserAttributes(attributes: Record<string, any>) {
    if (!this.isSupported()) return;

    try {
      await Superwall.setUserAttributes(attributes);
      console.log('Superwall user attributes updated');
    } catch (error) {
      console.error('Failed to set Superwall user attributes:', error);
    }
  }

  async reset() {
    if (!this.isSupported()) return;

    try {
      await Superwall.reset();
      console.log('Superwall user reset');
    } catch (error) {
      console.error('Failed to reset Superwall:', error);
    }
  }

  async registerEvent(eventName: string, params?: Record<string, any>) {
    if (!this.isSupported()) return;

    try {
      await Superwall.register(eventName, params);
      console.log('Superwall event registered:', eventName, params);
    } catch (error) {
      console.error('Failed to register Superwall event:', error);
    }
  }

  /**
   * Present a paywall for a specific placement
   * @param placement - The placement identifier configured in Superwall dashboard
   * @param params - Optional parameters to pass to the paywall
   */
  async presentPaywall(placement: string, params?: Record<string, any>) {
    if (!this.isSupported()) {
      console.log('Superwall not supported on this platform');
      return;
    }

    try {
      const result = await Superwall.register(placement, params);
      console.log('Paywall presentation result:', result);
      return result;
    } catch (error) {
      console.error('Failed to present paywall:', error);
      throw error;
    }
  }

  /**
   * Dismiss the currently presented paywall
   */
  async dismissPaywall() {
    if (!this.isSupported()) return;

    try {
      await Superwall.dismiss();
      console.log('Paywall dismissed');
    } catch (error) {
      console.error('Failed to dismiss paywall:', error);
    }
  }

  isInitialized() {
    return this.initialized;
  }
}

// Export singleton instance
export const superwallService = new SuperwallService();

// Helper function to initialize Superwall with user from auth
export async function initializeSuperwall(userId?: string, userEmail?: string) {
  const config: SuperwallConfig = {
    apiKey: SUPERWALL_API_KEY,
    userId,
    userAttributes: userEmail ? { email: userEmail } : undefined,
  };

  await superwallService.initialize(config);
}
