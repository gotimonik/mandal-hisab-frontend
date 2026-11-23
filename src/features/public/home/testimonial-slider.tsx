"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import type { Testimonial } from "@/config/site";
import { cn } from "@/lib/utils";
import { initials } from "./initials";

const AUTOPLAY_MS = 6000;

/**
 * Swipeable testimonial slider: native scroll-snap (so touch swipe just works), arrows and dots,
 * and a gentle autoplay that stops on hover, focus or touch and for people who prefer less motion.
 */
export function TestimonialSlider({ items }: { items: Testimonial[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [pages, setPages] = useState(items.length);
  const [paused, setPaused] = useState(false);

  /** How many slides fit at once → how many "pages" the dots stand for. */
  const measure = useCallback(() => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const perView = Math.max(1, Math.round(el.clientWidth / first.offsetWidth));
    setPages(Math.max(1, items.length - perView + 1));
    const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    setActive(Math.min(items.length - 1, Math.round(el.scrollLeft / step)));
  }, [items.length]);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure]);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (!el || !slide) return;
    el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (paused || pages <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => goTo(active + 1 >= pages ? 0 : active + 1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [active, pages, paused, goTo]);

  const many = pages > 1;

  return (
    <div
      className={cn("relative", items.length === 1 && "mx-auto max-w-xl")}
      role="region"
      aria-roledescription="carousel"
      aria-label="What Mandals say"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <ul ref={track} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0">
        {items.map((t, i) => (
          <li
            key={t.name + t.quote.slice(0, 20)}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}`}
            className={cn(
              "shrink-0 snap-start",
              items.length === 1 ? "basis-full" : "basis-[88%] sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]",
            )}
          >
            <figure className="flex h-full flex-col gap-4 rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] sm:p-6">
              <Quote aria-hidden className="size-6 text-primary/40" />
              <blockquote className="flex-1 text-[0.95rem] text-pretty sm:text-base">“{t.quote}”</blockquote>
              <figcaption className="flex items-center gap-3 border-t border-foreground/[0.08] pt-3 text-sm">
                <span aria-hidden className="bg-hero flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                  {initials(t.name)}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{t.name}</span>
                  {[t.role, t.mandal, t.city].some(Boolean) && <span className="block text-muted-foreground">{[t.role, t.mandal, t.city].filter(Boolean).join(", ")}</span>}
                  {t.translatedFrom && <span className="block text-xs text-muted-foreground">Translated from {t.translatedFrom}</span>}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {many && (
        <div className="mt-4 flex items-center justify-center gap-3 sm:mt-6">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => goTo(active <= 0 ? pages - 1 : active - 1)}
            className="flex size-10 items-center justify-center rounded-full bg-card shadow-card ring-1 ring-foreground/[0.08] transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to ${i + 1}`}
                aria-current={i === Math.min(active, pages - 1)}
                onClick={() => goTo(i)}
                className={cn("h-2 rounded-full transition-all", i === Math.min(active, pages - 1) ? "w-6 bg-primary" : "w-2 bg-foreground/20 hover:bg-foreground/35")}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next"
            onClick={() => goTo(active + 1 >= pages ? 0 : active + 1)}
            className="flex size-10 items-center justify-center rounded-full bg-card shadow-card ring-1 ring-foreground/[0.08] transition-colors hover:bg-secondary"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
