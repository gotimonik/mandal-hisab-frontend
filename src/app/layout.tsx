import type { Metadata, Viewport } from "next";
import { Anek_Gujarati, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
// Supplies the ₹ glyph today and Gujarati text later (loaded only when those characters appear).
const gujarati = Anek_Gujarati({ variable: "--font-gujarati", subsets: ["gujarati"], preload: false, adjustFontFallback: false });
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
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${gujarati.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
