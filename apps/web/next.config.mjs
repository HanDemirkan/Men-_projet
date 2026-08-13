import createBundleAnalyzer from "@next/bundle-analyzer";

// Storefront images (logo/cover/category/product) are served by the API's
// media streaming endpoints (see apps/api MediaModule), not colocated with
// the web app - so next/image needs that origin explicitly allow-listed.
// Derived from NEXT_PUBLIC_API_URL (already the single source of truth for
// the API's base URL - see apps/web/src/lib/env.ts) rather than a second,
// separately-configured env var that could drift out of sync with it.
const apiOrigin = new URL(process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000").origin;
const apiUrl = new URL(apiOrigin);

// Sprint 8 performance audit: `ANALYZE=true pnpm --filter @qr-platform/web build`
// emits an interactive treemap of what's actually in each route's bundle.
const withBundleAnalyzer = createBundleAnalyzer({ enabled: process.env["ANALYZE"] === "true" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@qr-platform/ui", "@qr-platform/shared"],
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", ""),
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/api/v1/media/**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
