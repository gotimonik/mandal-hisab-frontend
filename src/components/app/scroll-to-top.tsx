"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Every new page opens at the top. (Next.js only scrolls when the new page isn't already in view,
 * which can leave you halfway down.) Back / forward keeps the browser's own scroll restore, and
 * filters or tabs on the same page (only the ?query changes) keep your place.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const popped = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const onPop = () => (popped.current = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) return void (first.current = false);
    if (popped.current) return void (popped.current = false);
    if (window.location.hash) return; // links to a section (#how-it-works) scroll there
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
