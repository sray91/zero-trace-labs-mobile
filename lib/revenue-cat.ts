import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesIntroPrice,
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

    /**
     * Length of the free trial this user would get on `offering`, in days, or null if
     * none applies. The trial itself is an Introductory Offer configured on the products
     * in App Store Connect / Play Console — this only reads it so the paywall copy can
     * disclose it (App Review 3.1.2).
     *
     * Apple grants an intro offer once per subscription group, so a user who already
     * used their trial must not be told they'll get one. iOS reports that via the
     * eligibility check; Play only returns an intro price when the user is eligible.
     */
    async getFreeTrialDays(offering: PurchasesOffering): Promise<number | null> {
        if (!this.isInitialized) return null;
        const trialProducts = offering.availablePackages
            .map((pkg) => pkg.product)
            .filter((product) => product.introPrice?.price === 0);
        if (trialProducts.length === 0) return null;

        try {
            if (Platform.OS === 'ios') {
                const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(
                    trialProducts.map((product) => product.identifier)
                );
                const eligible = trialProducts.filter(
                    (product) =>
                        eligibility[product.identifier]?.status ===
                        Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
                );
                if (eligible.length === 0) return null;
                return introPeriodDays(eligible[0].introPrice!);
            }
            return introPeriodDays(trialProducts[0].introPrice!);
        } catch (error) {
            console.error('Error checking trial eligibility:', error);
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

const DAYS_PER_UNIT: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

function introPeriodDays(introPrice: PurchasesIntroPrice): number {
    return (DAYS_PER_UNIT[introPrice.periodUnit] ?? 1) * introPrice.periodNumberOfUnits;
}

export const revenueCatService = RevenueCatService.getInstance();
