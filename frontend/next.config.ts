/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  images: {
    domains: ["fonts.googleapis.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
