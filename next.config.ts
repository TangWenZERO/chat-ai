import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // 使得 Next.js 可在无 Node.js 服务器的环境下运行
  experimental: {
    outputStandalone: true,
  },
};

export default nextConfig;
