/**
 * The iOS / Android app adds this to its user agent (capacitor.config.ts → appendUserAgent),
 * so the server can tell app requests from website visits.
 */
export const NATIVE_APP_UA = "MandalHisabApp";

/**
 * Website-only pages. Inside the app these go straight to the user's Mandal.
 * The home page is allowed in the app (store badges and links to these pages are hidden there).
 */
export const WEB_ONLY_PATHS = ["/features", "/download", "/about", "/faq"];

/** Where the app goes instead: the last Mandal (or the Mandal list), or sign-in if signed out. */
export const APP_START = "/onboarding?auto=1";
