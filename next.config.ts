import type { NextConfig } from "next";

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
    if (!process.env.NEXT_PUBLIC_DB_CHAT_API) {
      console.warn(
        "NEXT_PUBLIC_DB_CHAT_API environment variable is not defined"
      );
      return [];
    }

    return [
      {
        source: "/api/adk/:path*",
        destination: process.env.NEXT_PUBLIC_DB_CHAT_API,
      },
    ];
  },
};

export default nextConfig;
