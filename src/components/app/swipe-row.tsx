"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A list row you can delete without opening it:
 * - phones: swipe left to show a red Delete button (a long swipe deletes straight away);
 * - computers: a trash button shows on the right when you hover the row.
 * A tap while it's swiped open just closes it again. Scrolling up and down is untouched.
 */
const ACTION = 88; // px of the Delete button

export function SwipeRow({ children, onDelete, label, disabled = false, className }: { children: ReactNode; onDelete: () => void; label: string; disabled?: boolean; className?: string }) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const open = x <= -ACTION / 2;
  const drag = useRef<{ x: number; y: number; base: number; dir?: "h" | "v" } | null>(null);
  const swallowClick = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  // tapping anywhere else closes an open row
  useEffect(() => {
    if (x === 0) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setX(0);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [x]);

  if (disabled) return <div className={className}>{children}</div>;

  return (
    <div ref={root} className={cn("group/swipe relative overflow-hidden rounded-xl", className)}>
      {/* behind the row: the phone's Delete button */}
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        onClick={onDelete}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-0.5 bg-destructive text-[11px] font-semibold text-white"
        // only there while swiping, so it never peeks out at the row's rounded corners
        style={{ width: Math.max(ACTION, -x), visibility: x === 0 && !dragging ? "hidden" : undefined }}
      >
        <Trash2 className="size-4" />
        {label}
      </button>

      <div
        className={cn("relative bg-card touch-pan-y", !dragging && "transition-transform duration-200 ease-out")}
        style={{ transform: x ? `translateX(${x}px)` : undefined }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          drag.current = { x: e.clientX, y: e.clientY, base: x };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (!d.dir) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            d.dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
            if (d.dir === "h") {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDragging(true);
            }
          }
          if (d.dir !== "h") return;
          const width = e.currentTarget.offsetWidth;
          setX(Math.min(0, Math.max(-width, d.base + dx)));
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d?.dir || d.dir !== "h") return;
          setDragging(false);
          swallowClick.current = true;
          const width = e.currentTarget.offsetWidth;
          // a long swipe (past 60 %) deletes; otherwise snap open or closed
          if (-x > width * 0.6) {
            setX(0);
            onDelete();
          } else setX(-x > ACTION / 2 ? -ACTION : 0);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
          setX((v) => (v < -ACTION / 2 ? -ACTION : 0));
        }}
        onClickCapture={(e) => {
          // the click that ends a swipe, or a tap on an open row, must not open the row
          if (swallowClick.current || x !== 0) {
            e.preventDefault();
            e.stopPropagation();
            swallowClick.current = false;
            if (x !== 0) setX(0);
          }
        }}
      >
        {children}
        {/* computers: a trash button on hover (or keyboard focus) */}
        <button
          type="button"
          onClick={onDelete}
          aria-label={label}
          className="absolute top-1/2 right-1.5 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-destructive hover:text-white focus-visible:flex [@media(hover:hover)]:group-hover/swipe:flex"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
