"use client";

import { useState } from "react";
import { FileImage, FileText, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isNativeApp } from "@/lib/native-plugins";
import { pdfFromJpeg } from "@/lib/pdf-from-jpeg";
import { track } from "@/lib/analytics";
import { useT } from "@/i18n/client";

type Kind = "image" | "pdf";

/** A picture of the document on screen (light paper colours, sharp on any phone). */
async function snapshot(el: HTMLElement) {
  const { domToCanvas } = await import("modern-screenshot");
  const opts = { scale: Math.min(4, Math.max(2, 1200 / el.offsetWidth)), backgroundColor: "#ffffff" };
  try {
    return await domToCanvas(el, opts);
  } catch {
    // the Mandal's logo couldn't be loaded into the picture: leave it out rather than fail
    return domToCanvas(el, { ...opts, filter: (n) => !(n instanceof HTMLImageElement) });
  }
}

const toBlob = (c: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("empty"))), type, quality));

async function makeFile(el: HTMLElement, kind: Kind, base: string, title: string): Promise<File> {
  const canvas = await snapshot(el);
  if (kind === "image") return new File([await toBlob(canvas, "image/png")], `${base}.png`, { type: "image/png" });
  const jpeg = new Uint8Array(await (await toBlob(canvas, "image/jpeg", 0.92)).arrayBuffer());
  const pdf = pdfFromJpeg(jpeg, canvas.width, canvas.height, title);
  return new File([pdf as BlobPart], `${base}.pdf`, { type: "application/pdf" });
}

const cancelled = (e: unknown) => /cancel|abort/i.test(String((e as { name?: string; message?: string })?.name ?? "") + String((e as { message?: string })?.message ?? e));

async function base64(file: Blob) {
  const s = await new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fail(r.error);
    r.readAsDataURL(file);
  });
  return s.slice(s.indexOf(",") + 1);
}

/** Hand the file to the phone's share sheet (WhatsApp, Files, email …), or download it. */
async function deliver(file: File, title: string, text: string) {
  if (isNativeApp()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
    const { uri } = await Filesystem.writeFile({ path: file.name, data: await base64(file), directory: Directory.Cache });
    try {
      await Share.share({ title, text, files: [uri], dialogTitle: title });
    } catch (e) {
      if (!cancelled(e)) throw e;
    }
    return;
  }
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return;
    } catch (e) {
      if (cancelled(e)) return;
      // the browser no longer allows sharing (it took too long): download instead
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Share a receipt / voucher as an image or a PDF, so anyone can see it without signing in —
 * or as a link, for people who use MandalHisab. `targetId` is the element that is the document.
 */
export function ShareDocument({ targetId, fileName, title, text, path }: { targetId: string; fileName: string; title: string; text: string; path: string }) {
  const t = useT();
  const [busy, setBusy] = useState<Kind | null>(null);
  const base = fileName.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "receipt";

  const shareFile = async (kind: Kind) => {
    const el = document.getElementById(targetId);
    if (!el || busy) return;
    track("share_document", { kind });
    setBusy(kind);
    try {
      await deliver(await makeFile(el, kind, base, title), title, text);
    } catch (e) {
      if ((e as { code?: string })?.code === "UNIMPLEMENTED") toast.error(t("share.updateApp"));
      else toast.error(t("share.failed"));
    } finally {
      setBusy(null);
    }
  };

  const shareLink = async () => {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (isNativeApp()) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ title, text, url, dialogTitle: title });
      } else if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success(t("share.copied"));
      }
    } catch {
      // closed the share sheet
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="outline" disabled={!!busy} />}>
        {busy ? <Loader2 className="animate-spin" /> : <Share2 />} {busy ? t("share.preparing") : t("share.share")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onClick={() => void shareFile("image")}>
          <FileImage /> {t("share.asImage")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void shareFile("pdf")}>
          <FileText /> {t("share.asPdf")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void shareLink()}>
          <Link2 />
          <span className="flex flex-col">
            {t("share.asLink")}
            <span className="text-xs text-muted-foreground">{t("share.asLinkHint")}</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
