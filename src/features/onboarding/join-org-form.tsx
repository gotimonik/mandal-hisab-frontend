"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/app/field";
import { apiRead } from "@/app/actions/api";
import { apiMutate } from "@/lib/api-client";
import { MemberAvatar } from "@/components/app/bits";
import { useT } from "@/i18n/client";
import type { Key } from "@/i18n/core";

interface Hit {
  id: string;
  name: string;
  city: string | null;
  description?: string | null;
  acceptsJoinRequests: boolean;
  myStatus: string | null;
  viaCode?: boolean;
  code?: string;
}

const STATUS_KEY: Record<string, Key> = { active: "onb.stMember", pending: "onb.stPending", deactivated: "onb.stRemoved" };

/** Find a Mandal by its name or its join code, then request to join (the admin approves). */
export function JoinOrgForm({ defaultCode, autoFocus = false }: { defaultCode?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const t = useT();
  const [q, setQ] = useState(defaultCode ?? "");
  const [message, setMessage] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [joining, setJoining] = useState<string | null>(null);

  const search = () =>
    start(async () => {
      setError(null);
      setHits(null);
      const term = q.trim();
      const looksLikeCode = /^[A-Z0-9]{6,12}$/.test(term.toUpperCase()) && !/\s/.test(term);
      const [byName, byCode] = await Promise.all([
        term.length >= 2 ? apiRead<Hit[]>(`/organizations/search?q=${encodeURIComponent(term)}`) : Promise.resolve({ ok: true as const, data: [] as Hit[] }),
        looksLikeCode ? apiRead<{ id: string; name: string; city: string | null }>(`/organizations/lookup?code=${encodeURIComponent(term.toUpperCase())}`) : Promise.resolve(null),
      ]);
      const list: Hit[] = byName.ok ? [...byName.data] : [];
      if (byCode && byCode.ok && !list.some((h) => h.id === byCode.data.id)) list.unshift({ ...byCode.data, acceptsJoinRequests: true, myStatus: null, viaCode: true, code: term.toUpperCase() });
      if (!byName.ok && !(byCode && byCode.ok)) return setError(byName.error);
      setHits(list);
    });

  const join = (h: Hit) =>
    start(async () => {
      setJoining(h.id);
      const r = await apiMutate({ path: "/organizations/join", body: { ...(h.code ? { code: h.code } : { organizationId: h.id }), message: message || undefined } });
      setJoining(null);
      if (!r.ok) return setError(r.error);
      toast.success(t("onb.sent", { name: h.name }));
      setHits((list) => list?.map((x) => (x.id === h.id ? { ...x, myStatus: "pending" } : x)) ?? null);
      router.refresh();
    });

  // A link with ?code=… looks the Mandal up straight away.
  const looked = useRef(false);
  useEffect(() => {
    if (!defaultCode || looked.current) return;
    looked.current = true;
    search();
  });

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <Input aria-label={t("onb.searchPh")} autoFocus={autoFocus} autoCapitalize="characters" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("onb.searchPh")} maxLength={100} className="h-11 rounded-xl" />
        <Button type="submit" disabled={pending || q.trim().length < 2} className="h-11 rounded-xl px-4">
          {pending && !joining ? <Loader2 className="animate-spin" /> : <Search />} {t("onb.find")}
        </Button>
      </form>
      {hits && hits.length === 0 && <p className="rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">{t("onb.noneFound")}</p>}
      {hits && hits.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {hits.map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card ring-1 ring-foreground/[0.06]">
                <MemberAvatar name={h.name} />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold">{h.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{[h.city, h.description].filter(Boolean).join(" · ") || (h.viaCode ? t("onb.byCode") : "")}</p>
                </div>
                {h.myStatus && h.myStatus !== "rejected" ? (
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{STATUS_KEY[h.myStatus] ? t(STATUS_KEY[h.myStatus]) : h.myStatus}</span>
                ) : h.acceptsJoinRequests ? (
                  <Button size="sm" onClick={() => join(h)} disabled={pending} className="shrink-0 rounded-xl">
                    {joining === h.id && <Loader2 className="animate-spin" />} {t("onb.requestJoin")}
                  </Button>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">{t("onb.inviteOnly")}</span>
                )}
              </li>
            ))}
          </ul>
          <Field label={t("onb.msg")} htmlFor="join-msg">
            <Textarea id="join-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} placeholder={t("onb.msgPh")} />
          </Field>
        </>
      )}
    </div>
  );
}
