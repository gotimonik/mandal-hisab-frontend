"use client";

import Link from "next/link";
import { HandCoins } from "lucide-react";
import { useT } from "@/i18n/client";

/** Logo and tagline above the sign-in / sign-up card. */
export function AuthBrand() {
  const t = useT();
  return (
    <>
      <Link href="/" className="mb-6 flex flex-col items-center gap-2 text-center text-white">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur">
          <HandCoins className="size-7" />
        </span>
        <span className="text-2xl font-extrabold tracking-tight">MandalHisab</span>
        <span className="text-sm text-white/85">{t("auth.tagline")}</span>
      </Link>
    </>
  );
}
