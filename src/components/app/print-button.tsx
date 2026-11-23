"use client";

import { useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { isNativeApp, webPrint } from "@/lib/native-plugins";
import { useT } from "@/i18n/client";

/**
 * Print / Save as PDF. On the website this is the browser's print dialog. Inside the iOS / Android
 * app the web view ignores window.print(), so the app's native print screen is opened instead
 * (it has "Save as PDF" on Android, and Share → Save to Files on iOS).
 */
export function PrintButton({ label }: { label?: string }) {
  const t = useT();
  const [opening, setOpening] = useState(false);
  const print = async () => {
    track("print");
    if (!isNativeApp()) return window.print();
    setOpening(true);
    try {
      await webPrint().print({ title: document.title });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      // an app build from before printing was added
      if (code === "UNIMPLEMENTED") toast.error(t("doc.updateApp"));
      else toast.error(t("doc.printFail"));
    } finally {
      setOpening(false);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={print} disabled={opening} className="no-print">
      {opening ? <Loader2 className="animate-spin" /> : <Printer />} {label ?? t("doc.print")}
    </Button>
  );
}
