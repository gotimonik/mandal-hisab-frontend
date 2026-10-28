"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isNativeApp } from "@/lib/native-plugins";

/**
 * Share a receipt (or anything) — the phone's own share sheet in the app (WhatsApp, SMS, email…),
 * the browser's share sheet where available, else copy to the clipboard.
 */
export function ShareButton({ title, text, path, label = "Share" }: { title: string; text: string; path: string; label?: string }) {
  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (isNativeApp()) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ title, text, url, dialogTitle: title });
      } else if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Copied — paste it anywhere");
      }
    } catch {
      // closed the share sheet: nothing to do
    }
  };
  return (
    <Button type="button" variant="outline" onClick={() => void share()}>
      <Share2 /> {label}
    </Button>
  );
}
