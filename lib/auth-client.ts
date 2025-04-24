import { createAuthClient } from "better-auth/react";
import { oneTapClient, multiSessionClient } from "better-auth/client/plugins";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    oneTapClient({
      clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      // Optional client configuration:
      autoSelect: false,
      cancelOnTapOutside: true,
      // Configure prompt behavior and exponential backoff:
      promptOptions: {
        baseDelay: 1000, // Base delay in ms (default: 1000)
        maxAttempts: 5, // Maximum number of attempts before triggering onPromptNotification (default: 5)
      },
    }),
    multiSessionClient(),
  ],
});

// Initialize oneTap through a function instead of using top-level await
export const initializeOneTap = async () => {
  return await authClient.oneTap();
};

export const { signIn, signOut, signUp, useSession } = authClient;
