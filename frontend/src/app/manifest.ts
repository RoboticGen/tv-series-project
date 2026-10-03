import type { MetadataRoute } from "next";

// Makes the site installable ("Add to Home Screen").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoboticGen Projects",
    short_name: "RoboticGen",
    description: "Publish, discover, and build RoboticGen student projects.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#29a1c1",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
