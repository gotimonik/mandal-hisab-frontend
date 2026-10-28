import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari, Noto_Sans_Gujarati } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { NativeShell } from "@/components/app/native-shell";
import { GoogleTag } from "@/components/app/google-tag";
import { AnalyticsClicks } from "@/components/app/analytics-clicks";
import "./globals.css";
import { NATIVE_APP_UA } from "@/lib/native";
import { site } from "@/config/site";
import { NavigationProgress } from "@/components/app/navigation-progress";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
// Gujarati letters (Geist has none). Only downloaded when Gujarati text is on the page.
const gujarati = Noto_Sans_Gujarati({ variable: "--font-gujarati", subsets: ["gujarati"], preload: false, adjustFontFallback: false });
// Hindi (Devanagari) letters, same idea.
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], preload: false, adjustFontFallback: false });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "MandalHisab — Hapta, savings & upad app for Mandals", template: "%s · MandalHisab" },
  description: site.description,
  applicationName: site.name,
  keywords: ["Mandal hisab", "Mandal accounting app", "hapta app", "hapta collection", "savings group app", "bhishi app", "upad", "upad interest", "community savings", "trust accounting", "cash book app", "Gujarati accounting app", "Hindi accounting app", "MandalHisab"],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "finance",
  openGraph: { type: "website", siteName: site.name, locale: "en_IN", url: "/" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  // Phone numbers in amounts (₹ 81,283) must not turn into call links on iPhone.
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "default" },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f8fe" },
    { media: "(prefers-color-scheme: dark)", color: "#14131f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${gujarati.variable} ${devanagari.variable} ${mono.variable} h-full antialiased`}>
      <head>
        {/* Inside the iOS / Android app: mark the page before it paints, so website-only links stay hidden.
            Lives in the root layout so it is only ever rendered on the server (React won't run scripts it renders on the client). */}
        <script dangerouslySetInnerHTML={{ __html: `try{var C=window.Capacitor;if(navigator.userAgent.indexOf(${JSON.stringify(NATIVE_APP_UA)})>-1||(C&&C.isNativePlatform&&C.isNativePlatform()))document.documentElement.classList.add("native-app")}catch(e){}` }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }} />
          <NativeShell />
          <GoogleTag />
          {/* usePathname() inside: Suspense keeps pages prerenderable (cacheComponents) */}
          <Suspense fallback={null}>
            <AnalyticsClicks />
          </Suspense>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
