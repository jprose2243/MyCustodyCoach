import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // ✅ Prevent build failures from native modules like `canvas`
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          canvas: false,
        },
      };
    }

    return config;
  },
};

export default nextConfig;