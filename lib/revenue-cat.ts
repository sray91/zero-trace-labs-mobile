import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';

// Platform-specific API keys. Read at module scope so Expo's EXPO_PUBLIC_* inlining bakes
// the values into the production bundle — the same reason the Clerk key is read in
// `app/_layout.tsx` rather than relying on a node_modules-side process.env read.
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

/**
 * Entitlement identifier configured in the RevenueCat dashboard. Both the $14.99/mo and
 * $149.99/yr products must unlock this same entitlement — the app never checks product
 * ids, only this. If you rename it in the dashboard, rename it here. Note the capital P — it must match the dashboard lookup key exactly (case-sensitive).
 */
export const PREMIUM_ENTITLEMENT_ID = 'Premium';

/** RevenueCat's native SDK is iOS/Android only — Expo web has no StoreKit/Play Billing. */
const IS_SUPPORTED_PLATFORM = Platform.OS === 'ios' || Platform.OS === 'android';

export class RevenueCatService {
    private static instance: RevenueCatService;
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;
    private currentAppUserId: string | null = null;

    private constructor() { }

    static getInstance(): RevenueCatService {
        if (!RevenueCatService.instance) {
            RevenueCatService.instance = new RevenueCatService();
        }
        return RevenueCatService.instance;
    }

    /**
     * True once `configure()` has actually run with a real API key.
     *
     * The subscription gate keys on this: when RevenueCat was never configured (missing
     * keys, or web) we must NOT lock users out of the app — we fall back to the
     * webhook-synced Convex record instead. See `components/auth/subscription-gate.tsx`.
     */
    get isConfigured(): boolean {
        return this.isInitialized;
    }

    get isSupported(): boolean {
        return IS_SUPPORTED_PLATFORM;
    }

    /**
     * Configure the SDK, identified as `userId`.
     *
     * `userId` MUST be the Clerk user id: the RevenueCat webhook sends it back as
     * `event.app_user_id`, and `convex/subscriptions.ts` looks the user up by
     * `clerkId` on that exact value. Anything else and purchases never link to an account.
     */
    async initialize(userId?: string) {
        if (!IS_SUPPORTED_PLATFORM) return;

        // Already configured — just make sure we're identified as the right user.
        if (this.isInitialized) {
            if (userId && userId !== this.currentAppUserId) {
                await this.identify(userId);
            }
            return;
        }

        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = (async () => {
            try {
                if (__DEV__ && LOG_LEVEL?.VERBOSE !== undefined) {
                    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
                }

                const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
                if (!apiKey) {
                    console.warn(
                        `RevenueCat ${Platform.OS} API key not set (EXPO_PUBLIC_REVENUECAT_${Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
                        }_API_KEY). Subscriptions are disabled in this build.`
                    );
                    return;
                }

                Purchases.configure({ apiKey, appUserID: userId });
                this.currentAppUserId = userId ?? null;
                this.isInitialized = true;
                console.log('RevenueCat configured', userId ? `as ${userId}` : '(anonymous)');
            } catch (error) {
                console.error('Failed to initialize RevenueCat:', error);
            } finally {
                this.initializationPromise = null;
            }
        })();

        return this.initializationPromise;
    }

    /** Re-identify an already-configured SDK (e.g. a different user signs in). */
    async identify(userId: string) {
        if (!this.isInitialized) return;
        try {
            await Purchases.logIn(userId);
            this.currentAppUserId = userId;
        } catch (error) {
            console.error('Error identifying RevenueCat user:', error);
        }
    }

    /**
     * Detach the device from the signed-out user, so the next person to sign in on this
     * device doesn't inherit their entitlements.
     */
    async logOut() {
        if (!this.isInitialized || !this.currentAppUserId) return;
        try {
            await Purchases.logOut();
            this.currentAppUserId = null;
        } catch (error) {
            console.error('Error logging out of RevenueCat:', error);
        }
    }

    /** Fetch the current offering (the set of packages the paywall renders). */
    async getOfferings(): Promise<PurchasesOffering | null> {
        if (!this.isInitialized) return null;
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current && offerings.current.availablePackages.length > 0) {
                return offerings.current;
            }
            return null;
        } catch (error) {
            console.error('Error fetching offerings:', error);
            return null;
        }
    }

    /** Purchase a package. Returns null if the user cancelled; throws on real failures. */
    async purchasePackage(pkg: PurchasesPackage): Promise<{
        customerInfo: CustomerInfo;
        productIdentifier: string;
    } | null> {
        try {
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
            return { customerInfo, productIdentifier };
        } catch (error: any) {
            if (!error.userCancelled) {
                console.error('Error purchasing package:', error);
                throw error;
            }
            return null;
        }
    }

    /** Restore previous purchases (required by App Review for any paid app). */
    async restorePurchases(): Promise<CustomerInfo | null> {
        if (!this.isInitialized) return null;
        try {
            return await Purchases.restorePurchases();
        } catch (error) {
            console.error('Error restoring purchases:', error);
            return null;
        }
    }

    async getCustomerInfo(): Promise<CustomerInfo | null> {
        if (!this.isInitialized) return null;
        try {
            return await Purchases.getCustomerInfo();
        } catch (error) {
            console.error('Error getting customer info:', error);
            return null;
        }
    }

    /**
     * Subscribe to entitlement changes (renewals, expirations, purchases made on another
     * device). Returns an unsubscribe function, or a no-op when unconfigured.
     */
    addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void): () => void {
        if (!this.isInitialized) return () => { };
        Purchases.addCustomerInfoUpdateListener(listener);
        return () => Purchases.removeCustomerInfoUpdateListener(listener);
    }

    isEntitled(
        customerInfo: CustomerInfo,
        entitlementId: string = PREMIUM_ENTITLEMENT_ID
    ): boolean {
        return customerInfo.entitlements.active[entitlementId] !== undefined;
    }
}

export const revenueCatService = RevenueCatService.getInstance();
