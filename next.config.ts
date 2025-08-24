import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  target: "server", // 使用 SSR
  experimental: {
    outputStandalone: true, // 必须开启以便独立部署
  },
  typescript: {
    ignoreBuildErrors: true, // 强制忽略类型检查错误
  },
};

export default nextConfig;
