import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopackをオフにして標準のWebpackを使用する（デザインを反映させるため）
  experimental: {}, 
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;