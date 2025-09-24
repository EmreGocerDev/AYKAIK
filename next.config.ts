import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rrzbinfnoxwrutvyqcwj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // YENİ: Spotify albüm kapakları için bunu ekleyin
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/image/**',
      },
    ],
  },
};

export default nextConfig;