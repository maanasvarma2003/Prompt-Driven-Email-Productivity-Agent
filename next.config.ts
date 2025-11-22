import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Advanced Performance Optimizations */
  reactStrictMode: true,
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Security & byte saving
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true, // Critical CSS extraction
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'], // Tree-shaking
  },

  // Cache headers for static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
