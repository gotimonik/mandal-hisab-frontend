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
 * Still a real link (/api/export…), so analytics and opening in a new tab keep working.
 * Inside the iOS / Android app the web view can't download files (following the link opened the
 * raw CSV as a page with no way back), so there the file is saved to the app's cache and handed
 * to the phone's share sheet: Save to Files, WhatsApp, Drive, email…
 */
async function shareCsvInApp(name: string, csv: string) {
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
  const { uri } = await Filesystem.writeFile({ path: name, data: csv, directory: Directory.Cache, encoding: Encoding.UTF8 });
  try {
    await Share.share({ title: name, files: [uri], dialogTitle: name });
  } catch (e) {
    // closing the share sheet without picking anything isn't an error
    if (!/cancel/i.test(String((e as { message?: string })?.message ?? e))) throw e;
  }
}
export function ExportCsvButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  return (
    <a
      href={href}
      aria-busy={busy || undefined}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), busy && "pointer-events-none opacity-70", className)}
      onClick={async (e) => {
        const app = Capacitor.isNativePlatform();
        if (!app && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
          const res = await fetch(href, { credentials: "same-origin" });
          if (!res.ok) throw new Error(String(res.status));
          const name = /filename="?([^";]+)"?/i.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "export.csv";
          if (app) {
            try {
              await shareCsvInApp(name, await res.text());
            } catch (err) {
              // an app build from before saving files was added
              if ((err as { code?: string })?.code === "UNIMPLEMENTED") toast.error(t("common.updateAppToDownload"));
              else throw err;
            }
            return;
          }
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
