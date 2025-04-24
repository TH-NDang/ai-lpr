import type { NextConfig } from "next";
import { env } from "./env";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
    ],
  },
  async rewrites() {
    if (!env.NEXT_PUBLIC_DB_CHAT_API) {
      console.warn(
        "NEXT_PUBLIC_DB_CHAT_API environment variable is not defined"
      );
      return [];
    }

    return [
      {
        source: "/api/adk/:path*",
        destination: env.NEXT_PUBLIC_DB_CHAT_API,
      },
    ];
  },
};

export default nextConfig;
