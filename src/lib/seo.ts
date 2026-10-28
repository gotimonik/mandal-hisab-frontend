import type { Metadata } from "next";
import { site } from "@/config/site";

/** The shared social preview (src/app/opengraph-image.jpg). */
export const OG_IMAGE = { url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "MandalHisab — transparent hisab for your Mandal: hapta, savings, upad and reports", type: "image/jpeg" };

/** Absolute URL on the main domain. */
export const absUrl = (path = "/") => `${site.url}${path === "/" ? "" : path}`;

/**
 * Metadata for a public page: title, description, canonical URL and matching
 * Open Graph / Twitter tags (the shared preview image comes from app/opengraph-image).
 */
export function pageMeta({ title, description, path, absoluteTitle = false }: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata {
  const full = absoluteTitle ? title : `${title} · ${site.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    // A page that sets its own openGraph replaces the site-wide one, so the preview image is repeated here.
    openGraph: { title: full, description, url: path, siteName: site.name, type: "website", locale: "en_IN", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: full, description, images: [OG_IMAGE] },
  };
}

/** Pages that should never appear in search results (sign-in helpers, the signed-in app). */
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false, googleBot: { index: false, follow: false } };

/* ------------------------------------------------------------------ structured data (JSON-LD) */

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;
const APP_ID = `${site.url}/#app`;

export function organizationLd() {
  const c = site.contact;
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: site.url,
    logo: { "@type": "ImageObject", url: absUrl("/icons/icon-512.png"), width: 512, height: 512 },
    description: site.description,
    email: c.email,
    ...(c.phone ? { telephone: c.phone.replace(/\s/g, "") } : {}),
    address: { "@type": "PostalAddress", addressLocality: "Surat", addressRegion: "Gujarat", postalCode: "394101", addressCountry: "IN" },
    contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: c.email, ...(c.phone ? { telephone: c.phone.replace(/\s/g, "") } : {}), areaServed: "IN", availableLanguage: ["English", "Gujarati", "Hindi"] }],
  };
}

export function websiteLd() {
  return { "@type": "WebSite", "@id": SITE_ID, url: site.url, name: site.name, description: site.description, publisher: { "@id": ORG_ID }, inLanguage: "en-IN" };
}

export function softwareAppLd() {
  return {
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: site.name,
    url: site.url,
    description: site.description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, Android, iOS",
    inLanguage: ["en", "gu", "hi"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR", description: site.pricing.headline },
    publisher: { "@id": ORG_ID },
    image: absUrl("/opengraph-image.jpg"),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absUrl(it.path) })),
  };
}

/** Serialize a JSON-LD graph safely for an inline <script>. */
export function ldJson(...nodes: object[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
