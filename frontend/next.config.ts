/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  output: "standalone",
  images: {
    domains: ["fonts.googleapis.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;