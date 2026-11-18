"use client";

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
import { monthLabelYM } from "@/lib/months";

function ChangeStartForm({ orgId, currentMonth }: { orgId: string; currentMonth: string }) {
  const router = useRouter();
  const close = useDialogClose();
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [founders, setFounders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>
        Months before the new start month disappear (so they no longer show as overdue). This works only while no hapta has been collected. Hapta collected by mistake? Reset the money first.
      </FormNote>
      <Field label="Hapta starts from" htmlFor="hs-new-start" hint={valid ? `First hapta month: ${monthLabelYM(startMonth)}` : undefined}>
        <Input id="hs-new-start" type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
      </Field>
      <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5">
        <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={founders} onChange={(e) => setFounders(e.target.checked)} />
        <span>
          <b>Everyone pays from this month</b>
          <span className="block text-xs text-muted-foreground">Untick if members who joined later should start in their joining month and pay a joining amount.</span>
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
            toast.success(`Hapta now starts in ${monthLabelYM(startMonth)}`);
            router.refresh();
            close();
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <CalendarClock />} Change start month
      </Button>
    </div>
  );
}

export function ChangeStartDialog({ orgId, currentMonth }: { orgId: string; currentMonth: string }) {
  return (
    <FormDialog trigger={<><CalendarClock /> Start month</>} triggerVariant="outline" triggerSize="sm" title="When the hapta starts" icon={<CalendarClock />} tone="indigo" openParam="start">
      <ChangeStartForm orgId={orgId} currentMonth={currentMonth} />
    </FormDialog>
  );
}
