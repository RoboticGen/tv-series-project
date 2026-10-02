import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone (server.js + only the traced node_modules) so the
  // Docker image ships without a full npm install -- see Dockerfile.
  output: "standalone",
  experimental: {
    serverActions: {
      // Images upload one per request through the uploadMediaAsset server
      // action; the default 1MB limit would reject anything near
      // MAX_IMAGE_BYTES (5MB, src/lib/validation.ts). Headroom covers the
      // multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
