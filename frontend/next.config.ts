import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg-boss"],
  experimental: {
    serverActions: {
      // Images upload one per request through the uploadMediaAsset server
      // action; the default 1MB limit would reject anything near
      // MAX_IMAGE_BYTES (5MB, the feature `schemas.ts` files). Headroom covers the
      // multipart overhead.
      bodySizeLimit: "6mb",
    },
    // Experimental -- removing this just makes useOffline() always false.
    useOffline: true,
  },
  async headers() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer-when-downgrade" }],
      },
    ];
  },
};

export default nextConfig;
