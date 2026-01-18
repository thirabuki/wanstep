import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopackのエラーを回避するためにwebpackを明示的に使用
  webpack: (config) => {
    return config;
  },
  // 前回のセキュリティ/ビルド設定も維持
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;