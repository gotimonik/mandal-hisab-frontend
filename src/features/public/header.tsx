"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand";
import { PUBLIC_NAV } from "./nav-links";

/** Sticky top bar. `actions` is the sign-in / open-app area (rendered on the server). */
export function PublicHeader({ actions, mobileActions, language }: { actions: ReactNode; mobileActions: ReactNode; language?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const active = (href: string) => !href.includes("#") && (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/60 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <BrandMark />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex [.native-app_&]:!hidden">
          {PUBLIC_NAV.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={cn("rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", active(l.href) && "text-foreground")}>
              {l.label}
            </Link>
          ))}
        </nav>
        {/* the language picker (sign-in pages only — the website pages are English-only) */}
        <div className="ml-auto flex items-center">{language}</div>
        <div className="hidden items-center gap-2 sm:flex [.native-app_&]:!hidden">{actions}</div>
        <Button variant="ghost" size="icon" className="lg:hidden [.native-app_&]:!hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu />
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[19rem] p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <BrandMark />
          </SheetHeader>
          <nav aria-label="Main" className="mt-4 flex flex-col gap-1" onClick={() => setOpen(false)}>
            {PUBLIC_NAV.map((l) => (
              <Link key={l.href} href={l.href} className={cn("rounded-xl px-3 py-2.5 text-base font-semibold hover:bg-muted", active(l.href) && "bg-muted")}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t pt-4" onClick={() => setOpen(false)}>
            {mobileActions}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
