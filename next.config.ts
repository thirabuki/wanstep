import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind v4 を Turbopack で動作させるための設定
  experimental: {
    turbo: {
      rules: {
        "*.css": ["postcss-loader"],
      },
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;