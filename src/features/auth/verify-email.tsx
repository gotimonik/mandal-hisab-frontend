"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { verifyEmailAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { useT } from "@/i18n/client";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** Opened from the link in the verification email. On success the account can sign in. */
export function VerifyEmail() {
  const t = useT();
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"working" | "ok" | "error">(token ? "working" : "error");
  const [msg, setMsg] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!token) return;
    verifyEmailAction(token).then((r) => {
      if (r.ok) {
        track("email_verified");
        setEmail(r.data.email);
        setState("ok");
      } else {
        setMsg(r.error);
        setState("error");
      }
    });
  }, [token]);

  if (state === "working") {
    return (
      <AuthCard title={t("auth.verifyTitle")}>
        <p role="status" className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("auth.verifying")}
        </p>
      </AuthCard>
    );
  }
  if (state === "ok") {
    const q = new URLSearchParams({ verified: "1" });
    if (email) q.set("email", email);
    return (
      <AuthCard title={t("auth.verifiedTitle")} description={t("auth.verifiedDesc")}>
        <div className="flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="size-7" />
          </span>
        </div>
        <Link href={`/login?${q}`} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          {t("auth.signIn")}
        </Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title={t("auth.verifyFailed")} description={token ? msg : t("auth.verifyMissing")}>
      <div className="flex justify-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <MailWarning className="size-7" />
        </span>
      </div>
      <Link href="/check-email" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        {t("auth.sendNewLink")}
      </Link>
      <Link href="/login" className="text-center text-sm text-muted-foreground hover:underline">
        {t("auth.signIn")}
      </Link>
    </AuthCard>
  );
}
