import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The iOS / Android apps are a native shell around the live web app — the Next.js server stays
 * the only place with API access and secrets (nothing secret is bundled into the app).
 *
 * Which site the app opens is fixed when you run `npx cap sync`:
 *   npm run cap:sync                      → https://mandalhisab.com (default)
 *   npm run cap:sync:android-local        → http://10.0.2.2:3000 (your `npm run dev`, Android emulator)
 *   npm run cap:sync:ios-local            → http://localhost:3000 (your `npm run dev`, iOS simulator)
 *   CAP_SERVER_URL=http://192.168.1.20:3000 npx cap sync   → a real phone on the same Wi-Fi
 */
const url = process.env.CAP_SERVER_URL || "https://mandalhisab.com";

const config: CapacitorConfig = {
  appId: "com.mandalhisab.app",
  appName: "MandalHisab",
  // Shown only if the site can't be loaded (e.g. offline at first launch).
  webDir: "mobile/www",
  server: {
    url,
    cleartext: url.startsWith("http://"),
    errorPath: "offline.html",
  },
  plugins: {
    SystemBars: { insetsHandling: "css", initialViewportFitValueHint: "cover" },
  },
  ios: { contentInset: "never" },
  android: { allowMixedContent: false },
};

export default config;
