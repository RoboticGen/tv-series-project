import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Images upload one per request through the uploadMediaAsset server
      // action; the default 1MB limit would reject anything near
      // MAX_IMAGE_BYTES (5MB, src/lib/validation.ts). Headroom covers the
      // multipart overhead.
      bodySizeLimit: "6mb",
    },
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
