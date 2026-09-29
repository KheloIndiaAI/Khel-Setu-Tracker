import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle (.next/standalone) for the Docker image.
  output: "standalone",
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
};

export default nextConfig;
