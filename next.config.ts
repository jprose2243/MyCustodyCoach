import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    // ✅ App-wide import alias support
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };

    // ✅ Handle binary modules (if needed for other dependencies)
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
      type: 'javascript/auto',
    });

    // ✅ Configure PDF.js for server-side rendering
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
      });
    }

    // ✅ Handle PDF.js worker files
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?mjs$/,
      type: 'asset/resource',
    });

    return config;
  },

  // ✅ Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },

  // ✅ Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;// Force fresh Vercel deployment - Thu Jul 10 17:03:16 MDT 2025
