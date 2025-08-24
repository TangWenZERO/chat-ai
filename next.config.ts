import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 直接配置在根级别
  target: "server", // 使用 SSR

  typescript: {
    ignoreBuildErrors: true, // 强制忽略类型检查错误
  },
};

export default nextConfig;
