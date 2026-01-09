import Purchases, {
    CustomerInfo,
    LogLevel,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';

// Get API Key from environment
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

export class RevenueCatService {
    private static instance: RevenueCatService;
    private isInitialized = false;

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

        if (!API_KEY) {
            console.warn('RevenueCat API Key not found. Subscription features will not work.');
            return;
        }

        try {
            Purchases.setLogLevel(LogLevel.DEBUG); // Helpful for debugging during dev
            Purchases.configure({ apiKey: API_KEY, appUserID: userId });

            if (userId) {
                await Purchases.logIn(userId);
            }

            this.isInitialized = true;
            console.log('RevenueCat initialized successfully');
        } catch (error) {
            console.error('Failed to initialize RevenueCat:', error);
        }
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
