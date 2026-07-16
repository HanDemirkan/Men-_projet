/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@qr-platform/ui", "@qr-platform/shared"],
};

export default nextConfig;
