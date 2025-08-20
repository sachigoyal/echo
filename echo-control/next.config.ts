import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// @ts-ignore - No type declarations available for this package
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const CORS_HEADERS = [
  { key: 'Access-Control-Allow-Origin', value: '*' },
  { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: '*' },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    authInterrupts: true,
  },
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'erjkmxp9url451wi.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'sbaaxpd5ro061s4a.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '**',
      },
    ],
  },
  transpilePackages: ['x402-next'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/oauth/:path*',
        headers: CORS_HEADERS,
      },
      {
        source: '/api/v1/:path*',
        headers: CORS_HEADERS,
      },
      {
        source: '/api/validate-jwt-token',
        headers: CORS_HEADERS,
      },
    ];
  },
};

export default withMDX(nextConfig);
