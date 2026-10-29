"use client";

import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/native-plugins";

/** App only: the installed iOS / Android version and build, e.g. "v1.0.1 (2)". Renders nothing on the website. */
export function AppVersion() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!isNativeApp()) return;
    let alive = true;
    import("@capacitor/app")
      .then(({ App }) => App.getInfo())
      .then(({ version, build }) => alive && setLabel(`v${version} (${build})`))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!label) return null;
  return <p className="px-2 pt-1 text-center text-[11px] text-muted-foreground/80 select-text">MandalHisab {label}</p>;
}
