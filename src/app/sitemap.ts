import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/features", priority: 0.9, changeFrequency: "monthly" },
  { path: "/download", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" },
  { path: "/register", priority: 0.7, changeFrequency: "yearly" },
];

// Bump when the public pages change meaningfully (legal pages use their own "last updated" date).
const CONTENT_UPDATED = new Date("2026-10-28");
const LEGAL_UPDATED = new Date(site.legal.lastUpdated);

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${site.url}${r.path === "/" ? "" : r.path}`,
    lastModified: r.path === "/privacy" || r.path === "/terms" ? LEGAL_UPDATED : CONTENT_UPDATED,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
