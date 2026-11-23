"use client";

import { useLang, useT } from "@/i18n/client";
import { monthName } from "@/i18n/core";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { FormNote } from "@/components/app/form-bits";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate } from "@/app/actions/api";

function ChangeStartForm({ orgId, currentMonth }: { orgId: string; currentMonth: string }) {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const close = useDialogClose();
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [founders, setFounders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>
        {t("setx.cs.note")}
      </FormNote>
      <Field label={t("setx.cs.from")} htmlFor="hs-new-start" hint={valid ? t("setx.cs.first", { month: monthName(lang, startMonth) }) : undefined}>
        <Input id="hs-new-start" type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
      </Field>
      <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5">
        <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={founders} onChange={(e) => setFounders(e.target.checked)} />
        <span>
          <b>{t("setx.cs.everyone")}</b>
          <span className="block text-xs text-muted-foreground">{t("setx.cs.everyoneHint")}</span>
        </span>
      </label>
      <FormError message={error} />
      <Button
        size="lg"
        disabled={pending || !valid || startMonth === currentMonth}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await apiMutate({ path: `/orgs/${orgId}/monthly-hapta/start`, body: { startMonth, founders } });
            if (!r.ok) return setError(r.error);
            toast.success(t("setx.cs.done", { month: monthName(lang, startMonth) }));
            router.refresh();
            close();
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <CalendarClock />} {t("setx.cs.button")}
      </Button>
    </div>
  );
}

export function ChangeStartDialog({ orgId, currentMonth }: { orgId: string; currentMonth: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><CalendarClock /> {t("setx.cs.trigger")}</>} triggerVariant="outline" triggerSize="sm" title={t("setx.cs.title")} icon={<CalendarClock />} tone="indigo" openParam="start">
      <ChangeStartForm orgId={orgId} currentMonth={currentMonth} />
    </FormDialog>
  );
}
