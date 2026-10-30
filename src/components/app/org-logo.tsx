"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A Mandal's logo in a tile (size and shape from `className`). Shows `children` — initials or an
 * icon — when the Mandal has no logo or the image can't load.
 */
export function OrgLogo({ logoUrl, className, children }: { logoUrl?: string | null; className?: string; children: ReactNode }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!logoUrl || failed === logoUrl) return <>{children}</>;
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-foreground/[0.08]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small Vercel Blob image (≤ 1 MB) */}
      <img src={logoUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(logoUrl)} className="size-full object-contain" />
    </span>
  );
}
