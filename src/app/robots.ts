import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/org/", "/onboarding", "/platform", "/account", "/invite", "/api/", "/check-email", "/verify-email", "/reset-password"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
