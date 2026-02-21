/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  output: "standalone",
  images: {
    domains: ["fonts.googleapis.com"],
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
