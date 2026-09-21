import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo parentに別の package-lock がある環境向け
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
