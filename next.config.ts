import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://opencards-api-production.up.railway.app/api/:path*',
      },
    ]
  }
};

export default nextConfig;
