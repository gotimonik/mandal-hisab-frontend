"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { Capacitor } from "@capacitor/core";
import { site } from "@/config/site";

/**
 * Google tag (gtag.js) for Google Analytics on the website. Production only, so local
 * development doesn't send test visits. Not loaded inside the iOS / Android app — there,
 * src/lib/analytics.ts sends to Firebase Analytics instead, so nothing is counted twice.
 * The tiny gtag() queue is set up right away so no event is lost; the 170 KB library itself
 * loads once the page is idle (lazyOnload) so it never slows the first paint on phones.
 * Automatic page views are off: <AnalyticsClicks /> sends each page view itself with IDs
 * and the query string (which can hold search text) removed.
 */
export function GoogleTag() {
  // false on the server and inside the app; true in a browser.
  const load = useSyncExternalStore(
    () => () => {},
    () => !Capacitor.isNativePlatform(),
    () => false,
  );
  const id = site.analytics.googleTagId;
  if (!load || !id || process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="lazyOnload" />
      <Script id="google-tag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}', { send_page_view: false });`}
      </Script>
    </>
  );
}
