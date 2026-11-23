"use client";

import { useT } from "@/i18n/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { resetPasswordAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { password } from "./schemas";
import { track } from "@/lib/analytics";

const Schema = z.object({ password, confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function ResetForm() {
  const t = useT();
  const token = useSearchParams().get("token") ?? "";
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : t("misc.auth.noToken"));
  const form = useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema), defaultValues: { password: "", confirm: "" } });
  const onSubmit = form.handleSubmit((v) =>
    start(async () => {
      const r = await resetPasswordAction({ token, password: v.password });
      if (!r.ok) return setError(r.error);
      track("password_reset_completed");
      setDone(true);
    }),
  );
  return (
    <AuthCard title={t("misc.auth.newPwTitle")} footer={<Link href="/login" className="hover:underline">{t("misc.auth.backSignIn")}</Link>}>
      {done ? (
        <p className="text-sm">
          {t("misc.auth.changed")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormError message={error} />
          <Field label={t("misc.auth.newPw")} htmlFor="password" error={form.formState.errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
          </Field>
          <Field label={t("misc.auth.confirmPw")} htmlFor="confirm" error={form.formState.errors.confirm?.message}>
            <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
          </Field>
          <Button type="submit" disabled={pending || !token}>
            {pending && <Loader2 className="animate-spin" />} {t("misc.auth.update")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
