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

/** The store apps, for links that open the app (Universal Links / Android App Links). */
export const APP_IDS = {
  /** Apple Team ID + bundle id (ios/App/App.xcodeproj) */
  ios: "8A8JG3NNKM.com.mandalhisab.app",
  /** applicationId in android/app/build.gradle */
  android: "com.mandalhisab.app",
};

/**
 * Links to these open the installed app instead of the browser: a Mandal screen (receipts,
 * notifications in emails …), invitations and sign-in / email links. Website-only pages
 * (home, guides …) stay in the browser. Keep in sync with android/app/src/main/AndroidManifest.xml.
 */
export const APP_LINK_PREFIXES = ["/org", "/invite", "/onboarding", "/account", "/login", "/register", "/verify-email", "/reset-password", "/forgot-password", "/check-email"];

const LINK_HOSTS = ["mandalhisab.com", "www.mandalhisab.com"];

/**
 * The in-app path for a link that opened the app, or null if it isn't one of ours.
 * Website-only pages go to the app's start screen instead.
 */
export function appLinkTarget(link: string, here: string = typeof window === "undefined" ? "" : window.location.host): string | null {
  let u: URL;
  try {
    u = new URL(link);
  } catch {
    return null;
  }
  if (!LINK_HOSTS.includes(u.host) && u.host !== here) return null;
  if (isWebOnlyPath(u.pathname)) return APP_START;
  return u.pathname + u.search + u.hash;
}
