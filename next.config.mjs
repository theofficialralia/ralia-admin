/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/v1/:path*', destination: `${API_ORIGIN}/v1/:path*` },
    ];
  },
};

export default nextConfig;
