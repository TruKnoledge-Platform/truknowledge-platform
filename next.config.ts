import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/favicon-icon" }];
  },
};

export default nextConfig;