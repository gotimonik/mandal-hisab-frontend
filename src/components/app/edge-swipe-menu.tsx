"use client";

import { useEffect, useRef } from "react";
import { isNativeApp } from "@/lib/native-plugins";

/** How far from the left screen edge a swipe may start (px). */
const EDGE = 32;
/** Horizontal distance that counts as a swipe (px). */
const TRIGGER = 56;

/**
 * App only, phone layout only: swipe right from the left screen edge to open the menu,
 * and swipe left anywhere while it's open to close it — like most phone apps.
 * Only mostly-horizontal swipes count, so normal scrolling and pull-to-refresh are unaffected.
 */
export function EdgeSwipeMenu({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!isNativeApp()) return;
    const desktop = window.matchMedia("(min-width: 1024px)"); // lg: the sidebar is always visible
    // another pop-up (dialog, sheet, menu) is on screen — don't open the menu over it
    const otherPopupOpen = () =>
      [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"]')].some((el) => el.getBoundingClientRect().width > 0);

    let start: { x: number; y: number; mode: "open" | "close" } | null = null;

    const onStart = (e: TouchEvent) => {
      start = null;
      if (e.touches.length !== 1 || desktop.matches) return;
      const { clientX: x, clientY: y } = e.touches[0];
      if (openRef.current) start = { x, y, mode: "close" };
      else if (x <= EDGE && !otherPopupOpen()) start = { x, y, mode: "open" };
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;
      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) return void (start = null); // a vertical scroll
      if (Math.abs(dx) < TRIGGER || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (start.mode === "open" && dx > 0) setOpen(true);
      if (start.mode === "close" && dx < 0) setOpen(false);
      start = null;
    };
    const onEnd = () => {
      start = null;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [setOpen]);

  return null;
}
