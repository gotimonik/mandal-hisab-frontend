# MandalHisab iOS & Android apps (Capacitor)

The apps are a native shell around the web app: they open the Next.js site, so every feature
works the same and nothing secret ships inside the app. Native projects: `../ios`, `../android`.

## First time (after pulling)

```bash
npm install          # installs Capacitor (needs to run on your Mac, not in a VM)
npm run cap:sync     # copies capacitor.config into ios/ and android/
```

## Run it

| What the app opens | Command, then |
|---|---|
| Live site (https://mandalhisab.com) | `npm run cap:sync` |
| Your `npm run dev` in the **Android emulator** | `npm run cap:sync:android-local` |
| Your `npm run dev` in the **iOS simulator** | `npm run cap:sync:ios-local` |
| Your `npm run dev` on a **real phone** (same Wi-Fi) | `CAP_SERVER_URL=http://<your-mac-ip>:3000 npx cap sync` and start dev with `next dev -H 0.0.0.0` |

- **Android**: `npm run cap:android` → Android Studio → pick an emulator or phone → ▶ Run.
  Debug builds allow `http://` (for local dev); release builds are HTTPS-only.
- **iOS**: `npm run cap:ios` → Xcode → target **App** → Signing & Capabilities → choose your Team
  (a free Apple ID works for your own iPhone) → pick a simulator or phone → ▶ Run.
  Swift Package Manager is used, so no CocoaPods is needed.

Run the matching `cap:sync…` again whenever you switch between live and local.
Web changes (pages, features) need no rebuild — the app loads them from the site.

## Icons & splash

Sources are in `mobile/assets` (icon-only, icon-foreground, icon-background, splash, splash-dark).
To regenerate: `npx @capacitor/assets generate --assetPath mobile/assets --iconBackgroundColor '#4f46e5' --splashBackgroundColor '#4f46e5' --splashBackgroundColorDark '#312e81'`

## App-only code

`src/components/app/native-shell.tsx` (Android back button, status bar colour). It does nothing on the website.
