import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/dashboard-pro" : "",
  devIndicators: false,
};

export default nextConfig;
