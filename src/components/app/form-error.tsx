"use client";

import { useEffect, useRef } from "react";
import { Translated } from "@/i18n/translated";

/** Fired after a form submit fails, so an error that didn't change still scrolls back into view. */
export const FORM_ERROR_EVENT = "mh:form-error";

/** Call after showing a form error (e.g. a failed save). */
export function announceFormError() {
  if (typeof window === "undefined") return;
  // after React has committed the new error
  requestAnimationFrame(() => window.dispatchEvent(new Event(FORM_ERROR_EVENT)));
}

/** Room for the sticky header on phones, so the message isn't hidden behind it. */
const TOP_GAP = 72;

function revealIfHidden(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (r.top >= TOP_GAP && r.bottom <= vh) return; // already in view
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
}

/**
 * The error box at the top of a form. When it appears (or the form fails again) and it's
 * off-screen — e.g. the Save button is at the bottom of a long Settings page — it scrolls
 * itself into view, so the person sees why nothing was saved.
 */
export function FormError({ message }: { message?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && ref.current) revealIfHidden(ref.current);
  }, [message]);

  useEffect(() => {
    const onFail = () => {
      if (ref.current) revealIfHidden(ref.current);
    };
    window.addEventListener(FORM_ERROR_EVENT, onFail);
    return () => window.removeEventListener(FORM_ERROR_EVENT, onFail);
  }, []);

  if (!message) return null;
  return (
    <div ref={ref} role="alert" className="scroll-mt-20 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <Translated text={message} />
    </div>
  );
}
