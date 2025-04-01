import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    // Configure Turbo to handle Node.js modules
    turbo: {
      resolveAlias: {
        fs: 'false',
        net: 'false',
        tls: 'false',
        crypto: 'false',
        perf_hooks: 'false',
        'pg-native': 'false',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  webpack: (config) => {
    // Add fallbacks for Node modules used by the postgres package
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      perf_hooks: false,
      crypto: false,
      'pg-native': false,
    }

    return config
  },
}

export default nextConfig
