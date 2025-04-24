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
    if (!process.env.API_DB_CHAT_API_URL) {
      console.warn("API_DB_CHAT_API_URL environment variable is not defined");
      return [];
    }

    return [
      {
        source: "/api/adk/:path*",
        destination: process.env.API_DB_CHAT_API_URL,
      },
    ];
  },
};

export default nextConfig;
