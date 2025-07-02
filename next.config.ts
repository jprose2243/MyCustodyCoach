import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    // ✅ Fix PDF.js issues by aliasing to the legacy build explicitly
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.js',
    };

    // ✅ Prevent bundling node-only modules like canvas in client build
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