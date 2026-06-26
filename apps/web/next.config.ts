import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["libsodium", "libsodium-wrappers"]
};

export default nextConfig;
