import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/** Lets people add MandalHisab to their phone's home screen and open it like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/onboarding?auto=1&source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9f8fe",
    theme_color: "#4f39d6",
    lang: "en-IN",
    categories: ["finance", "productivity", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
