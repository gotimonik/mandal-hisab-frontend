"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export type DemoVideoLabels = { title: string; desc: string; watch: string; lang: string };

/**
 * "How to use MandalHisab": a card with the video's poster that opens the demo video in a popup.
 * The video file lives on Vercel Blob (site.demoVideo); nothing loads until the person taps play.
 * `variant`: "card" (a full card with poster) or "inline" (one small link row, for inside another card).
 */
export function DemoVideo({ src, poster, labels, source, variant = "card", className }: { src: string; poster?: string | null; labels: DemoVideoLabels; source: string; variant?: "card" | "inline"; className?: string }) {
  const [open, setOpen] = useState(false);
  const play = () => {
    track("demo_video_open", { source });
    setOpen(true);
  };

  return (
    <>
      {variant === "inline" ? (
        <button type="button" onClick={play} className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm font-semibold text-primary hover:underline", className)}>
          <PlayCircle className="size-4.5" /> {labels.watch}
          <span className="font-normal text-muted-foreground">· {labels.lang}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={play}
          className={cn("flex w-full items-center gap-3.5 rounded-2xl bg-card p-3 text-left shadow-card ring-1 ring-primary/20 transition-colors hover:bg-muted/50 active:scale-[0.99] sm:p-3.5", className)}
        >
          <span className="relative h-24 w-[3.4rem] shrink-0 overflow-hidden rounded-xl bg-primary/10 ring-1 ring-foreground/10 sm:h-28 sm:w-16">
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element -- a small poster from Vercel Blob; no optimisation needed
              <img src={poster} alt="" loading="lazy" className="size-full object-cover" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <PlayCircle className="size-7 text-white drop-shadow" />
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{labels.title}</span>
            <span className="mt-0.5 block text-xs text-pretty text-muted-foreground sm:text-sm">{labels.desc}</span>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              <PlayCircle className="size-3.5" /> {labels.watch}
              <span className="font-normal opacity-80">· {labels.lang}</span>
            </span>
          </span>
        </button>
      )}
      <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal={false}>
        <DialogContent className="w-[min(92vw,24rem)] gap-2 p-2 pt-10 sm:max-w-sm">
          <DialogTitle className="sr-only">{labels.title}</DialogTitle>
          {open && (
            // captions are burnt into the video itself
            <video src={src} poster={poster ?? undefined} controls autoPlay playsInline preload="metadata" className="aspect-[9/16] max-h-[78vh] w-full rounded-xl bg-black" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
