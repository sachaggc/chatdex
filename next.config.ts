import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {}, // Active Turbopack (Next.js 16 par défaut)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
