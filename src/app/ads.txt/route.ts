import { site } from "@/config/site";

/**
 * /ads.txt — tells ad buyers which ad network may sell ads on this site. Served only once an
 * AdSense client ID is set in src/config/site.ts (ca-pub-… → pub-…).
 */
export function GET() {
  const client = site.ads.adsenseClientId;
  if (!client) return new Response("Not found", { status: 404 });
  const pub = client.replace(/^ca-/, "");
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
