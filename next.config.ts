import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: "/home/sourov/Desktop/rag_app",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
