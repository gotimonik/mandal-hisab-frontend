import Link from "next/link";
import { Globe, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-current">
      <path d="M16.37 12.7c-.03-2.6 2.13-3.86 2.23-3.92-1.21-1.78-3.1-2.02-3.78-2.05-1.6-.16-3.13.95-3.95.95-.81 0-2.07-.93-3.4-.9-1.75.03-3.37 1.02-4.27 2.58-1.82 3.16-.47 7.84 1.31 10.4.87 1.25 1.9 2.66 3.26 2.61 1.31-.05 1.8-.85 3.38-.85 1.58 0 2.02.85 3.4.82 1.41-.02 2.3-1.27 3.16-2.53.99-1.45 1.4-2.86 1.43-2.93-.03-.01-2.74-1.05-2.77-4.18ZM13.8 5.06c.72-.88 1.21-2.09 1.08-3.31-1.04.04-2.3.7-3.05 1.57-.67.77-1.26 2.01-1.1 3.2 1.16.09 2.35-.59 3.07-1.46Z" />
    </svg>
  );
}
function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <path fill="#34A853" d="M3.6 1.8 13.4 12 3.6 22.2c-.36-.2-.6-.6-.6-1.1V2.9c0-.5.24-.9.6-1.1Z" />
      <path fill="#FBBC04" d="m17 8.4-3.6 3.6L17 15.6l4.1-2.3c1.2-.7 1.2-1.9 0-2.6L17 8.4Z" />
      <path fill="#EA4335" d="M13.4 12 3.6 22.2c.35.2.8.2 1.3-.1L17 15.6 13.4 12Z" />
      <path fill="#4285F4" d="M13.4 12 17 8.4 4.9 1.9c-.5-.3-.95-.3-1.3-.1L13.4 12Z" />
    </svg>
  );
}

function Badge({ href, glyph, top, bottom, dark }: { href: string | null; glyph: React.ReactNode; top: string; bottom: string; dark: boolean }) {
  const body = (
    <>
      {glyph}
      <span className="flex flex-col text-left leading-tight">
        <span className="text-[10px] opacity-80">{href ? top : "Coming soon on"}</span>
        <span className="text-base font-semibold">{bottom}</span>
      </span>
    </>
  );
  const cls = cn("inline-flex h-14 min-w-44 items-center gap-2.5 rounded-2xl px-4 ring-1 transition-opacity", dark ? "bg-zinc-950 text-white ring-white/15" : "bg-white text-zinc-950 ring-black/10", !href && "opacity-75");
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(cls, "hover:opacity-90")}>
      {body}
    </a>
  ) : (
    <span className={cls} aria-label={`${bottom} app — coming soon`}>
      {body}
    </span>
  );
}

/** Play Store / App Store badges (shown as "Coming soon" until links are set in site config) + the web app. */
export function StoreBadges({ dark = true, showWeb = true, className }: { dark?: boolean; showWeb?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <Badge href={site.stores.android} glyph={<PlayGlyph />} top="Get it on" bottom="Google Play" dark={dark} />
      <Badge href={site.stores.ios} glyph={<AppleGlyph />} top="Download on the" bottom="App Store" dark={dark} />
      {showWeb && (
        <Link href="/register" className={cn("inline-flex h-14 items-center gap-2.5 rounded-2xl px-4 ring-1 transition-opacity hover:opacity-90", dark ? "bg-white/15 text-white ring-white/25 backdrop-blur" : "bg-primary text-primary-foreground ring-primary")}>
          <Globe className="size-6" />
          <span className="flex flex-col text-left leading-tight">
            <span className="text-[10px] opacity-80">Works today in</span>
            <span className="text-base font-semibold">Your browser</span>
          </span>
        </Link>
      )}
      <span className="sr-only">
        <Smartphone /> The phone apps are on the way. Until then, MandalHisab works fully in any phone browser.
      </span>
    </div>
  );
}
