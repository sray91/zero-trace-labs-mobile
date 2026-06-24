export default {
  providers: [
    {
      // Clerk JWT issuer. Use the Frontend API URL of your Clerk instance.
      // Must match the `convex` JWT template configured in the Clerk dashboard.
      domain: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
      applicationID: "convex",
    },
  ],
};
