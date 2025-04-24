import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().min(1),
    NEXT_PUBLIC_DB_CHAT_API: z.string().min(1),
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  // runtimeEnv: {
  //   DATABASE_URL: process.env.DATABASE_URL,
  //   NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  // },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_DB_CHAT_API: process.env.NEXT_PUBLIC_DB_CHAT_API,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },

  skipValidation: true,
  emptyStringAsUndefined: true,
});
