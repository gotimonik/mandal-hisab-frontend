"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/app/field";
import { ChoicePills, FormNote, SubmitButton } from "@/components/app/form-bits";
import { site } from "@/config/site";

const TOPICS = ["Getting started", "Support", "Feedback", "Partnership", "Other"] as const;
type Topic = (typeof TOPICS)[number];

/**
 * There's no server-side inbox yet, so this builds a ready-to-send email and opens the
 * visitor's own email app (mailto:). Nothing is sent from the website itself.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mandal, setMandal] = useState("");
  const [topic, setTopic] = useState<Topic>("Getting started");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; message?: string }>({});
  const [opened, setOpened] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Please enter your name";
    if (phone.trim() && !/^[+\d][\d\s-]{6,16}$/.test(phone.trim())) next.phone = "Enter a valid phone number, or leave it empty";
    if (message.trim().length < 10) next.message = "Please write a few words (at least 10 characters)";
    setErrors(next);
    if (Object.keys(next).length) return;
    const subject = `[${topic}] ${mandal.trim() ? `${mandal.trim()} — ` : ""}${name.trim()}`;
    const details = [`Name: ${name.trim()}`, phone.trim() ? `Phone: ${phone.trim()}` : null, mandal.trim() ? `Mandal: ${mandal.trim()}` : null, `Topic: ${topic}`].filter(Boolean);
    const body = [message.trim(), "", "—", ...details].join("\n");
    window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  const hasErrors = Object.keys(errors).length > 0;
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {hasErrors && <FormError message="Please fix the highlighted fields." />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Your name" htmlFor="c-name" error={errors.name}>
          <Input id="c-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name || undefined} />
        </Field>
        <Field label="Phone (optional)" htmlFor="c-phone" error={errors.phone}>
          <Input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone || undefined} />
        </Field>
        <Field label="Mandal / group name (optional)" htmlFor="c-mandal" className="sm:col-span-2">
          <Input id="c-mandal" value={mandal} onChange={(e) => setMandal(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">What is it about?</span>
        <ChoicePills label="Topic" value={topic} onChange={setTopic} options={TOPICS.map((t) => ({ value: t, label: t }))} />
      </div>
      <Field label="Message" htmlFor="c-msg" error={errors.message}>
        <Textarea id="c-msg" rows={5} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} aria-invalid={!!errors.message || undefined} />
      </Field>
      {opened ? (
        <FormNote tone="good">
          Your email app should now be open with the message ready — just press send. If nothing opened, email us at <b>{site.contact.email}</b>.
        </FormNote>
      ) : (
        <FormNote>This opens your email app with the message filled in, ready to send to {site.contact.email}.</FormNote>
      )}
      <SubmitButton icon={<Mail />} className="sm:w-auto sm:self-start sm:px-6">
        Open in my email app
      </SubmitButton>
    </form>
  );
}
