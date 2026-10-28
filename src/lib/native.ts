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
export const WEB_ONLY_PATHS = ["/", "/features", "/download", "/about", "/faq"];

/** Where the app goes instead: the last Mandal (or the Mandal list), or sign-in if signed out. */
export const APP_START = "/onboarding?auto=1";
