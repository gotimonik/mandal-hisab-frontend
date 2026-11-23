"use client";

import { useT } from "@/i18n/client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { forgotPasswordAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { email } from "./schemas";
import { track } from "@/lib/analytics";

const Schema = z.object({ email });

export function ForgotForm() {
  const t = useT();
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema), defaultValues: { email: "" } });
  const onSubmit = form.handleSubmit((v) =>
    start(async () => {
      const r = await forgotPasswordAction(v);
      if (!r.ok) return setError(r.error);
      track("password_reset_requested");
      setSent(true);
    }),
  );
  return (
    <AuthCard title={t("misc.auth.forgotTitle")} description={t("misc.auth.forgotDesc")} footer={<Link href="/login" className="hover:underline">{t("misc.auth.backSignIn")}</Link>}>
      {sent ? (
        <p className="text-sm">{t("misc.auth.sent")}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormError message={error} />
          <Field label={t("auth.email")} htmlFor="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} {t("misc.auth.send")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
