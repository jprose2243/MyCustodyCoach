import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Prevent build-time errors from native Node modules like `canvas`
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
