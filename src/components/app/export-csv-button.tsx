"use client";

import { useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * "Download CSV" that shows "Preparing…" while the file is built, then saves it.
 * Still a real link (/api/export…), so analytics and opening in a new tab keep working;
 * inside the iOS / Android app it falls back to plain navigation.
 */
export function ExportCsvButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  return (
    <a
      href={href}
      aria-busy={busy || undefined}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), busy && "pointer-events-none opacity-70", className)}
      onClick={async (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || Capacitor.isNativePlatform()) return;
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
          const res = await fetch(href, { credentials: "same-origin" });
          if (!res.ok) throw new Error(String(res.status));
          const name = /filename="?([^";]+)"?/i.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "export.csv";
          const url = URL.createObjectURL(await res.blob());
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 10_000);
        } catch {
          toast.error(t("common.downloadFailed"));
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? (
        <>
          <Loader2 className="animate-spin" /> {t("common.preparing")}
        </>
      ) : (
        children
      )}
    </a>
  );
}
