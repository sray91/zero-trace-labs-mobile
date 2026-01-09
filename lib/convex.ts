import { useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

// Get Convex URL from environment
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
    throw new Error(
        "Missing Convex URL. Please set EXPO_PUBLIC_CONVEX_URL in your .env"
    );
}

// Create the Convex client
export const convex = new ConvexReactClient(convexUrl);

// Export provider component for use in _layout.tsx
export { ConvexProviderWithClerk, useAuth };
