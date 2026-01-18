import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 余計な設定をすべて削除
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;