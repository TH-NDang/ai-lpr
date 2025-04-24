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
    return [
      {
        source: "/api/adk/:path*",
        destination: process.env.API_DB_CHAT_API_URL!,
      },
    ];
  },
};

export default nextConfig;
