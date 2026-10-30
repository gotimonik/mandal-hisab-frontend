/**
 * The iOS / Android app adds this to its user agent (capacitor.config.ts → appendUserAgent),
 * so the server can tell app requests from website visits.
 */
export const NATIVE_APP_UA = "MandalHisabApp";

/**
 * Website-only pages. They never show inside the app: the app goes straight to the user's
 * Mandal (or sign-in) instead. Blocked three ways — the server redirect (src/proxy.ts), a
 * redirect before paint on the page itself (NativeRedirect), and taps on links to them
 * (NativeShell) — so the home page can't appear in the app even if one of them is missed.
 */
export const WEB_ONLY_PATHS = ["/", "/features", "/download", "/about", "/faq", "/benefits", "/how-it-works", "/glossary", "/guides"];

/** Website-only sections where every sub-page is website-only too (e.g. /guides/<article>). */
const WEB_ONLY_PREFIXES = ["/guides/"];

/** True for a path that must never open inside the iOS / Android app. */
export const isWebOnlyPath = (pathname: string) => WEB_ONLY_PATHS.includes(pathname) || WEB_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

/** Where the app goes instead: the last Mandal (or the Mandal list), or sign-in if signed out. */
export const APP_START = "/onboarding?auto=1";
