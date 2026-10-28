import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Expense bills/invoices (max 5 MB) are uploaded through a Server Action.
    serverActions: { bodySizeLimit: "6mb" },
    // Note: don't turn on `inlineCss` — it puts ~150 KB of CSS in <head> before the title and
    // Open Graph tags, and WhatsApp's link preview only reads the start of the page.
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // One address for search engines: www.mandalhisab.com → mandalhisab.com (same path and query).
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "www.mandalhisab.com" }], destination: "https://mandalhisab.com/:path*", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
