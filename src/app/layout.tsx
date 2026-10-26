import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari, Noto_Sans_Gujarati } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { NativeShell } from "@/components/app/native-shell";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
// Gujarati letters (Geist has none). Only downloaded when Gujarati text is on the page.
const gujarati = Noto_Sans_Gujarati({ variable: "--font-gujarati", subsets: ["gujarati"], preload: false, adjustFontFallback: false });
// Hindi (Devanagari) letters, same idea.
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], preload: false, adjustFontFallback: false });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "MandalHisab", template: "%s · MandalHisab" },
  description: "Financial management for Mandals, trusts and community organizations — hapta, loans, collections, expenses and reports.",
  applicationName: "MandalHisab",
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
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }} />
          <NativeShell />
        </ThemeProvider>
      </body>
    </html>
  );
}
