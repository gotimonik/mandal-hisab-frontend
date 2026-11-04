import type { CapacitorConfig } from "@capacitor/cli";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

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

// The app's built-in start / offline pages hand over to this address (mobile/www/start.js).
// Written here so it always matches `server.url` — also for the local test builds above.
writeFileSync(join(process.cwd(), "mobile/www/app-url.js"), `// Written by capacitor.config.ts on every \`cap sync\`: where the app's website lives.\nwindow.MH_APP_URL = ${JSON.stringify(url)};\n`);

const config: CapacitorConfig = {
  // Lets the server tell app requests from website visits (website-only pages are skipped in the app).
  appendUserAgent: "MandalHisabApp",
  // The app window behind the website: brand purple like the splash, so the moment between the
  // splash and the first page never shows as a black screen.
  backgroundColor: "#5E36D3",
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
    // The app icon on the brand purple stays up until the website has loaded and calls
    // SplashScreen.hide() (components/app/native-shell.tsx), or the offline page does.
    // 15 s is only a safety cap — a shorter one hid the splash before a slow first load had
    // drawn anything, leaving a black screen.
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 15000,
      launchFadeOutDuration: 300,
      backgroundColor: "#5E36D3",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    SystemBars: { insetsHandling: "css", initialViewportFitValueHint: "cover" },
    // Push notifications (components/app/native-push.tsx): also show them while the app is open.
    FirebaseMessaging: { presentationOptions: ["alert", "badge", "sound"] },
  },
  ios: { contentInset: "never" },
  android: { allowMixedContent: false },
};

export default config;
