import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // ✅ App-wide import alias support
      '@': path.resolve(__dirname, '.'),

      // ✅ Fix PDF.js compatibility
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.js',
    };

    // ✅ Prevent server-only modules from leaking into client builds
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        canvas: false,
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;