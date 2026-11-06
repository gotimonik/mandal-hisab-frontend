"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Smartphone } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { useMoney } from "@/components/app/currency";
import { cn } from "@/lib/utils";

/**
 * Paying the Mandal by UPI: a link that opens the member's UPI app (PhonePe, Google Pay, Paytm …)
 * with the Mandal's UPI ID and the amount filled in, and the same as a QR code for paying from
 * another phone or where the link doesn't open an app (most iPhones). MandalHisab never touches
 * the money: it goes from the member's UPI app straight to the Mandal's own UPI ID.
 */

export interface UpiPayee {
  upiId: string;
  payeeName: string;
}

/** The standard UPI deep link (NPCI "upi://pay"). Values are %-encoded: some apps read "+" literally. */
export function upiLink({ upiId, payeeName, amountPaise, note }: UpiPayee & { amountPaise: number; note?: string }) {
  const q: [string, string][] = [
    ["pa", upiId],
    ["pn", payeeName.slice(0, 50)],
  ];
  if (amountPaise > 0) q.push(["am", (amountPaise / 100).toFixed(2)]);
  q.push(["cu", "INR"]);
  const tn = note?.replace(/\s+/g, " ").trim().slice(0, 50);
  if (tn) q.push(["tn", tn]);
  return `upi://pay?${q.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`;
}

function QrCode({ text, label }: { text: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    import("qrcode")
      .then((q) => q.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }))
      .then((s) => live && setSvg(s))
      .catch(() => live && setSvg(null));
    return () => {
      live = false;
    };
  }, [text]);
  return (
    <div role="img" aria-label={label} className="size-40 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-foreground/10 [&_svg]:size-full">
      {svg ? <div className="size-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="size-full animate-pulse rounded-lg bg-muted" />}
    </div>
  );
}

export function UpiPayPanel({ upi, amountPaise, note }: { upi: UpiPayee; amountPaise: number; note?: string }) {
  const t = useT();
  const money = useMoney();
  const link = upiLink({ ...upi, amountPaise, note });
  return (
    <section aria-label={t("pay.upiTitle")} className="flex flex-col gap-3 rounded-2xl bg-violet-500/8 p-3 ring-1 ring-violet-500/15">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("pay.upiTo", { name: upi.payeeName })}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{upi.upiId}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(upi.upiId);
              toast.success(t("pay.upiCopied"));
            } catch {
              /* clipboard blocked: the UPI ID is on screen to type */
            }
          }}
        >
          <Copy /> {t("pay.upiCopy")}
        </Button>
      </div>
      <a href={link} className={cn(buttonVariants({ size: "lg" }), "h-12 w-full gap-2 text-base")}>
        <Smartphone /> {amountPaise > 0 ? t("pay.upiPay", { amount: money.fmt(amountPaise) }) : t("pay.upiOpen")}
      </a>
      <div className="flex items-center gap-3">
        <QrCode text={link} label={t("pay.upiTitle")} />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("pay.upiScan")} {t("pay.upiStraight")}
        </p>
      </div>
    </section>
  );
}
