import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/site";

// Steers crawlers away from signed-in and utility pages
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/media/"],
      disallow: [
        "/api/",
        "/dashboard",
        "/projects/new",
        "/projects/*/edit",
        "/projects/*/print",
        "/projects/*/submissions/",
        "/ui",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
