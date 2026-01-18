import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // 開発中は無効、本番は有効
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ここに設定を追加できます
};

export default withPWA(nextConfig);