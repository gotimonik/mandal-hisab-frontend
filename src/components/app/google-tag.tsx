import Script from "next/script";
import { site } from "@/config/site";

/**
 * Google tag (gtag.js) for Google Analytics. Production only, so local development
 * doesn't send test visits. Automatic page views are off: <AnalyticsClicks /> sends each
 * page view itself with IDs and the query string (which can hold search text) removed.
 */
export function GoogleTag() {
  const id = site.analytics.googleTagId;
  if (!id || process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="google-tag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}', { send_page_view: false });`}
      </Script>
    </>
  );
}
