"use client";

import { Capacitor } from "@capacitor/core";
import type * as React from "react";

/**
 * True inside the iOS / Android app or on a touch-first browser (phones, tablets).
 * Used to avoid moving focus into text fields there, which pops up the on-screen keyboard.
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  if (Capacitor.isNativePlatform()) return true;
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

/** Combine a local ref with one passed in through props. */
export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}
