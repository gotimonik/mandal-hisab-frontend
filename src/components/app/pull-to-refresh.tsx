"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCw } from "lucide-react";
import { isNativeApp } from "@/lib/native-plugins";
import { cn } from "@/lib/utils";

const TRIGGER = 72;

/** App only: pull down at the top of a screen to reload its numbers, like any phone app. */
export function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<number | null>(null);
  const dist = useRef(0);

  useEffect(() => {
    if (!isNativeApp()) return;
    // a visible pop-up is open (screens kept alive in the background are hidden, so they don't count)
    const busy = () => [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"]')].some((el) => (el as HTMLElement).offsetParent !== null || getComputedStyle(el).position === "fixed" && el.getBoundingClientRect().height > 0);
    const onStart = (e: TouchEvent) => {
      start.current = window.scrollY <= 0 && e.touches.length === 1 && !busy() ? e.touches[0].clientY : null;
      dist.current = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (start.current === null) return;
      const d = e.touches[0].clientY - start.current;
      if (d <= 0 || window.scrollY > 0) return void (dist.current = 0, setPull(0));
      dist.current = Math.min(d * 0.5, TRIGGER * 1.5);
      setPull(dist.current);
    };
    const onEnd = () => {
      if (start.current !== null && dist.current >= TRIGGER) {
        setRefreshing(true);
        router.refresh();
        setTimeout(() => setRefreshing(false), 1200);
      }
      start.current = null;
      dist.current = 0;
      setPull(0);
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
  }, [router]);

  const show = refreshing || pull > 8;
  if (!show) return null;
  const ready = pull >= TRIGGER;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+3.75rem)] z-[60] flex justify-center" style={{ transform: `translateY(${refreshing ? 8 : Math.max(0, pull - 24)}px)` }}>
      <span className={cn("flex size-9 items-center justify-center rounded-full bg-card text-primary shadow-lg ring-1 ring-foreground/10", ready && !refreshing && "bg-primary text-primary-foreground")}>
        {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4 transition-transform" style={{ transform: `rotate(${pull * 3}deg)` }} />}
      </span>
    </div>
  );
}
