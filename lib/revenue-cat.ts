import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';

// Platform-specific API keys
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export class RevenueCatService {
    private static instance: RevenueCatService;
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;

    private constructor() { }

    static getInstance(): RevenueCatService {
        if (!RevenueCatService.instance) {
            RevenueCatService.instance = new RevenueCatService();
        }
        return RevenueCatService.instance;
    }

    /**
     * Initialize RevenueCat SDK
     * Should be called early in the app lifecycle
     */
    async initialize(userId?: string) {
        if (this.isInitialized) return;

        // If initialization is already in progress, wait for it
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            try {
                // Set log level for debugging
                if (LOG_LEVEL?.VERBOSE !== undefined) {
                    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
                }

                // Configure with platform-specific API key
                if (Platform.OS === 'ios') {
                    if (!IOS_API_KEY) {
                        console.warn('RevenueCat iOS API Key not found. Subscription features will not work.');
                        return;
                    }
                    Purchases.configure({ apiKey: IOS_API_KEY, appUserID: userId });
                } else if (Platform.OS === 'android') {
                    if (!ANDROID_API_KEY) {
                        console.warn('RevenueCat Android API Key not found. Subscription features will not work.');
                        return;
                    }
                    Purchases.configure({ apiKey: ANDROID_API_KEY, appUserID: userId });
                }

                if (userId) {
                    await Purchases.logIn(userId);
                }

                this.isInitialized = true;
                console.log('RevenueCat initialized successfully');
            } catch (error) {
                console.error('Failed to initialize RevenueCat:', error);
            } finally {
                this.initializationPromise = null;
            }
        })();

        return this.initializationPromise;
    }

    /**
     * Fetch current offerings (paywalls)
     */
    async getOfferings(): Promise<PurchasesOffering | null> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                return offerings.current;
            }
            return null;
        } catch (error) {
            console.error('Error fetching offerings:', error);
            return null;
        }
    }

    /**
     * Purchase a specific package
     */
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

    /**
     * Restore previous purchases
     */
    async restorePurchases(): Promise<CustomerInfo | null> {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (error) {
            console.error('Error restoring purchases:', error);
            return null;
        }
    }

    /**
     * Get latest customer info
     */
    async getCustomerInfo(): Promise<CustomerInfo | null> {
        try {
            return await Purchases.getCustomerInfo();
        } catch (error) {
            console.error('Error getting customer info:', error);
            return null;
        }
    }

    /**
     * Check if user is entitled to a specific entitlement
     * Default entitlement identifier is often 'premium' or similar, check your RC dashboard
     */
    isEntitled(customerInfo: CustomerInfo, entitlementId: string = 'premium'): boolean {
        return (
            customerInfo.entitlements.active[entitlementId] !== undefined
        );
    }
}

export const revenueCatService = RevenueCatService.getInstance();
