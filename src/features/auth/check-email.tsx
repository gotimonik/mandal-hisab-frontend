"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Loader2, MailCheck, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { resendVerificationEmailAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { useT } from "@/i18n/client";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const COOLDOWN = 60;
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : null);

/**
 * Shown after registering (and when someone tries to sign in before verifying): the account
 * can't be used until the emailed link is opened. Lets them resend the link.
 */
export function CheckEmail() {
  const t = useT();
  const sp = useSearchParams();
  const fromLogin = sp.get("from") === "login";
  const next = safeNext(sp.get("next"));
  // ?email= is read on every render (the page may come from a static shell); the field is
  // only for people who arrive without one (e.g. from an expired link).
  const emailParam = sp.get("email");
  const known = !!emailParam;
  const [typed, setEmail] = useState("");
  const email = emailParam ?? typed;
  // An email was just sent when they registered, so start with the timer running.
  const [wait, setWait] = useState(known && !fromLogin ? COOLDOWN : 0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const resend = () =>
    start(async () => {
      setError(null);
      const r = await resendVerificationEmailAction(email.trim());
      if (!r.ok) return setError(r.error);
      track("verification_email_resent");
      setSent(true);
      setWait(COOLDOWN);
    });

  const q = new URLSearchParams();
  if (email) q.set("email", email.trim());
  if (next) q.set("next", next);
  const signInHref = `/login${q.size ? `?${q}` : ""}`;

  return (
    <AuthCard
      title={t("auth.checkTitle")}
      description={known ? (fromLogin ? t("auth.notVerified", { email }) : t("auth.checkDesc", { email })) : t("auth.checkDescNoEmail")}
      footer={
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="hover:underline">
          {t("auth.wrongEmail")}
        </Link>
      }
    >
      <div className="flex justify-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-7" />
        </span>
      </div>
      {known && (
        <ol className="flex flex-col gap-2 text-sm">
          {[t("auth.checkStep1"), t("auth.checkStep2"), t("auth.checkStep3")].map((s, i) => (
            <li key={s} className="flex items-center gap-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      )}
      <FormError message={error} />
      {sent && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0" /> {t("auth.resent")}
        </p>
      )}
      {!known && (
        <Field label={t("auth.email")} htmlFor="ce-email">
          <Input id="ce-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      )}
      <Link href={signInHref} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        {t("auth.verifiedSignIn")}
      </Link>
      <Button type="button" variant="outline" size="lg" onClick={resend} disabled={pending || wait > 0 || !email.trim()}>
        {pending ? <Loader2 className="animate-spin" /> : <Send />} {wait > 0 ? t("auth.resendIn", { s: wait }) : t("auth.resend")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("auth.checkSpam")}</p>
    </AuthCard>
  );
}
