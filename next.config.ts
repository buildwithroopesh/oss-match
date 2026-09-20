import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security: GITHUB_API_TOKEN and server credentials must never leak to client bundles.
  // Next.js server components and route handlers access process.env.GITHUB_API_TOKEN safely.
  experimental: {},
  serverExternalPackages: [],
};

export default nextConfig;
