// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WANSTEP",
  description: "愛犬の健康管理ログ",
  // ここから追加
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  manifest: "/manifest.json",
  // ここまで追加
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" translate="no" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body>{children}</body>
    </html>
  );
}