"use client";

import { useState } from "react";
import { Copy, FileImage, FileText, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isNativeApp } from "@/lib/native-plugins";
import { pageCuts, pdfFromJpeg, pdfFromJpegPages, type PdfPage } from "@/lib/pdf-from-jpeg";
import { track } from "@/lib/analytics";
import { useT } from "@/i18n/client";

type Kind = "image" | "pdf";

/**
 * Most pixels one picture may have. Phones refuse bigger canvases (iOS Safari: ~16.7 million) and
 * hand back a blank image, so very long documents get a slightly lower scale instead.
 */
const MAX_PIXELS = 16_000_000;

/** How sharp to draw: about 3× (print quality on A4), never below 1.5×, never over the pixel limit. */
export function snapshotScale(widthPx: number, heightPx: number) {
  const wanted = Math.min(4, Math.max(3, 2400 / Math.max(1, widthPx)));
  const fits = Math.sqrt(MAX_PIXELS / Math.max(1, widthPx * heightPx));
  return Math.max(1.5, Math.min(wanted, fits));
}

/** A picture of the document on screen (light paper colours, sharp on any phone). */
async function snapshot(el: HTMLElement) {
  const { domToCanvas } = await import("modern-screenshot");
  const opts = { scale: snapshotScale(el.offsetWidth, el.offsetHeight), backgroundColor: "#ffffff" };
  try {
    return await domToCanvas(el, opts);
  } catch {
    // the Mandal's logo couldn't be loaded into the picture: leave it out rather than fail
    return domToCanvas(el, { ...opts, filter: (n) => !(n instanceof HTMLImageElement) });
  }
}

const toBlob = (c: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("empty"))), type, quality));

/**
 * A long document cut into A4-shaped pages: only between rows — the elements marked `data-row` —
 * so no line is split across two pages.
 */
function pageCanvases(el: HTMLElement, canvas: HTMLCanvasElement): HTMLCanvasElement[] {
  const scale = canvas.height / el.offsetHeight;
  const top = el.getBoundingClientRect().top;
  const rowBottoms = [...el.querySelectorAll<HTMLElement>("[data-row]")].map((r) => (r.getBoundingClientRect().bottom - top) * scale);
  const pageHeight = Math.floor(canvas.width * (841.89 / 595.28));
  const cuts = [0, ...pageCuts(canvas.height, pageHeight, rowBottoms), canvas.height];
  const out: HTMLCanvasElement[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const h = cuts[i + 1] - cuts[i];
    if (h <= 0) continue;
    const part = document.createElement("canvas");
    part.width = canvas.width;
    part.height = h;
    const ctx = part.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, part.width, h);
    ctx.drawImage(canvas, 0, cuts[i], canvas.width, h, 0, 0, canvas.width, h);
    out.push(part);
  }
  return out;
}

/** The pages as one PDF (high JPEG quality: small coloured figures stay crisp). */
async function pagedPdf(parts: HTMLCanvasElement[], title: string) {
  const pages: PdfPage[] = [];
  for (const part of parts) pages.push({ jpeg: new Uint8Array(await (await toBlob(part, "image/jpeg", 0.96)).arrayBuffer()), widthPx: part.width, heightPx: part.height });
  return pdfFromJpegPages(pages, title);
}

/** Width (CSS px) a paged document is drawn at for sharing — about an A4 page, whatever the screen. */
const PAGE_WIDTH = 760;

/**
 * Run `fn` on a copy of the document laid out at the page width, off screen — so a passbook
 * shared from a phone is the same wide, tidy document as one shared from a computer.
 */
async function atPageWidth<T>(el: HTMLElement, fn: (copy: HTMLElement) => Promise<T>, width = PAGE_WIDTH): Promise<T> {
  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = `position:fixed;left:-20000px;top:0;width:${width}px;pointer-events:none;`;
  const copy = el.cloneNode(true) as HTMLElement;
  copy.removeAttribute("id");
  copy.style.width = `${width}px`;
  holder.appendChild(copy);
  document.body.appendChild(holder);
  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return await fn(copy);
  } finally {
    holder.remove();
  }
}

/**
 * The file(s) to share. A paged document shared as an image becomes one picture per A4 page:
 * WhatsApp and other chat apps shrink a photo to ~1600 px on its longest side, so one very tall
 * picture loses its small text, while page-sized pictures stay readable.
 */
async function makeFiles(el: HTMLElement, kind: Kind, base: string, title: string, paged = false, pageWidth = PAGE_WIDTH): Promise<File[]> {
  if (paged)
    return atPageWidth(
      el,
      async (copy) => {
        const canvas = await snapshot(copy);
        const parts = pageCanvases(copy, canvas);
        if (kind === "pdf") return [new File([(await pagedPdf(parts, title)) as BlobPart], `${base}.pdf`, { type: "application/pdf" })];
        if (parts.length <= 1) return [new File([await toBlob(canvas, "image/png")], `${base}.png`, { type: "image/png" })];
        return Promise.all(parts.map(async (part, i) => new File([await toBlob(part, "image/png")], `${base}-${i + 1}.png`, { type: "image/png" })));
      },
      pageWidth,
    );
  const canvas = await snapshot(el);
  if (kind === "image") return [new File([await toBlob(canvas, "image/png")], `${base}.png`, { type: "image/png" })];
  const jpeg = new Uint8Array(await (await toBlob(canvas, "image/jpeg", 0.96)).arrayBuffer());
  return [new File([pdfFromJpeg(jpeg, canvas.width, canvas.height, title) as BlobPart], `${base}.pdf`, { type: "application/pdf" })];
}

/** One picture of the whole document (for the clipboard). */
async function wholeImage(el: HTMLElement, base: string, paged = false, pageWidth = PAGE_WIDTH): Promise<File> {
  const shot = async (node: HTMLElement) => new File([await toBlob(await snapshot(node), "image/png")], `${base}.png`, { type: "image/png" });
  return paged ? atPageWidth(el, shot, pageWidth) : shot(el);
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

/**
 * Hand the file to the phone's share sheet (WhatsApp, Files, email …), or download it.
 * Only the file is shared — no title or text with it: the share sheet's "Copy" copies every item,
 * so a file shared with text pasted as the picture plus the words, which looked like duplicates.
 */
async function deliver(files: File[], title: string) {
  if (isNativeApp()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
    const uris: string[] = [];
    for (const file of files) uris.push((await Filesystem.writeFile({ path: file.name, data: await base64(file), directory: Directory.Cache })).uri);
    try {
      await Share.share({ files: uris, dialogTitle: title });
    } catch (e) {
      if (!cancelled(e)) throw e;
    }
    return;
  }
  if (navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
      return;
    } catch (e) {
      if (cancelled(e)) return;
      // the browser no longer allows sharing (it took too long): download instead
    }
  }
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/**
 * Share a receipt / voucher as an image or a PDF, so anyone can see it without signing in —
 * or as a link, for people who use MandalHisab. `targetId` is the element that is the document.
 */
export function ShareDocument({ targetId, fileName, title, text, path, paged = false, allowLink = true, pageWidth = PAGE_WIDTH }: { targetId: string; fileName: string; title: string; text: string; path: string; /** long documents: A4 pages in the PDF */ paged?: boolean; /** false for private things nobody else can open */ allowLink?: boolean; /** width (CSS px) a paged document is drawn at — wider for many columns */ pageWidth?: number }) {
  const t = useT();
  const [busy, setBusy] = useState<Kind | null>(null);
  const base = fileName.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "receipt";

  const shareFile = async (kind: Kind) => {
    const el = document.getElementById(targetId);
    if (!el || busy) return;
    track("share_document", { kind });
    setBusy(kind);
    try {
      await deliver(await makeFiles(el, kind, base, title, paged, pageWidth), title);
    } catch (e) {
      if ((e as { code?: string })?.code === "UNIMPLEMENTED") toast.error(t("share.updateApp"));
      else toast.error(t("share.failed"));
    } finally {
      setBusy(null);
    }
  };

  // the picture straight to the clipboard (websites only: the app's web view can't do this)
  const canCopyImage = typeof window !== "undefined" && !isNativeApp() && typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write;
  const copyImage = async () => {
    const el = document.getElementById(targetId);
    if (!el || busy) return;
    track("share_document", { kind: "copy_image" });
    setBusy("image");
    try {
      // the clipboard is given a promise so Safari still counts it as part of the click
      const png = wholeImage(el, base, paged, pageWidth);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png.then((f) => f as Blob) })]);
      toast.success(t("share.imageCopied"));
    } catch {
      toast.error(t("share.failed"));
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
        {canCopyImage && (
          <DropdownMenuItem onClick={() => void copyImage()}>
            <Copy /> {t("share.copyImage")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => void shareFile("pdf")}>
          <FileText /> {t("share.asPdf")}
        </DropdownMenuItem>
        {allowLink && (
          <DropdownMenuItem onClick={() => void shareLink()}>
            <Link2 />
            <span className="flex flex-col">
              {t("share.asLink")}
              <span className="text-xs text-muted-foreground">{t("share.asLinkHint")}</span>
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
