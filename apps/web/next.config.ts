import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@praman/schemas'],
  async redirects() {
    return [
      {
        source: '/jobs/new',
        destination: '/jobs?new=true',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
