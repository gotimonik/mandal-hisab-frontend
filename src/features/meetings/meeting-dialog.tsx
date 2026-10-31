"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, CalendarCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/app/field";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { SubmitButton } from "@/components/app/form-bits";
import { apiMutate } from "@/lib/api-client";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { useT } from "@/i18n/client";

interface Props {
  /** The Mandal's address — filled in as the place */
  defaultPlace: string;
  timezone?: string;
}

function Form({ defaultPlace, timezone }: Props) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const t = useT();
  const today = todayISO(timezone);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState(defaultPlace);
  const [events, setEvents] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => newIdempotencyKey("mt"));
  const [pending, start] = useTransition();

  const save = () => {
    if (!date) return setError(t("meetings.vDate"));
    if (!time) return setError(t("meetings.vTime"));
    if (!place.trim()) return setError(t("meetings.vPlace"));
    start(async () => {
      setError(null);
      const res = await apiMutate({ path: `/orgs/${orgId}/meetings`, body: { date, time, place: place.trim(), events: events.trim() || undefined, idempotencyKey: key } });
      if (!res.ok) return setError(res.error);
      toast.success(t("meetings.sent"));
      close();
      router.refresh();
    });
  };

  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("meetings.date")} htmlFor="mt-date">
          <Input id="mt-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t("meetings.time")} htmlFor="mt-time">
          <Input id="mt-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label={t("meetings.place")} htmlFor="mt-place" hint={defaultPlace ? t("meetings.placeHint") : t("meetings.placeNoAddress")}>
        <Input id="mt-place" maxLength={300} value={place} onChange={(e) => setPlace(e.target.value)} />
      </Field>
      <Field label={t("meetings.events")} htmlFor="mt-events">
        <Textarea id="mt-events" rows={3} maxLength={1000} placeholder={t("meetings.eventsPh")} value={events} onChange={(e) => setEvents(e.target.value)} />
      </Field>
      <SubmitButton pending={pending} icon={<BellRing />}>
        {t("meetings.send")}
      </SubmitButton>
    </form>
  );
}

export function MeetingDialog(props: Props & { defaultOpen?: boolean }) {
  const t = useT();
  return (
    <FormDialog defaultOpen={props.defaultOpen} trigger={<><CalendarCheck /> {t("meetings.call")}</>} title={t("meetings.callTitle")} description={t("meetings.callDesc")} icon={<CalendarCheck />} tone="sky">
      <Form {...props} />
    </FormDialog>
  );
}
