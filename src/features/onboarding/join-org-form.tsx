"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/app/field";
import { apiRead } from "@/app/actions/api";
import { apiMutate } from "@/lib/api-client";
import { MemberAvatar } from "@/components/app/bits";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
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

  const [searching, setSearching] = useState(false);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (raw: string) => {
    if (timer.current) clearTimeout(timer.current);
    const id = ++seq.current;
    const term = raw.trim();
    setError(null);
    if (term.length < 2) {
      setSearching(false);
      setHits(null);
      return;
    }
    setSearching(true);
    const looksLikeCode = /^[A-Z0-9]{6,12}$/.test(term.toUpperCase()) && !/\s/.test(term);
    const [byName, byCode] = await Promise.all([
      apiRead<Hit[]>(`/organizations/search?q=${encodeURIComponent(term)}`),
      looksLikeCode ? apiRead<{ id: string; name: string; city: string | null }>(`/organizations/lookup?code=${encodeURIComponent(term.toUpperCase())}`) : Promise.resolve(null),
    ]);
    if (id !== seq.current) return; // the user kept typing: a newer search owns the results
    setSearching(false);
    const list: Hit[] = byName.ok ? [...byName.data] : [];
    if (byCode && byCode.ok && !list.some((h) => h.id === byCode.data.id)) list.unshift({ ...byCode.data, acceptsJoinRequests: true, myStatus: null, viaCode: true, code: term.toUpperCase() });
    if (!byName.ok && !(byCode && byCode.ok)) return setError(byName.error);
    setHits(list);
  };

  // Search as the user types; a link with ?code=… looks the Mandal up straight away.
  const firstRun = useRef(true);
  useEffect(() => {
    const delay = firstRun.current && defaultCode ? 0 : 300;
    firstRun.current = false;
    timer.current = setTimeout(() => void search(q), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the text changes
  }, [q]);

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

  const showResults = q.trim().length >= 2;
  const canMessage = !!hits && hits.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void search(q);
        }}
      >
        <Input aria-label={t("onb.searchPh")} autoFocus={autoFocus} autoCapitalize="characters" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("onb.searchPh")} maxLength={100} className="h-11 rounded-xl" />
        <Button type="submit" disabled={searching || q.trim().length < 2} className="h-11 rounded-xl px-4">
          {searching ? <Loader2 className="animate-spin" /> : <Search />} {t("onb.find")}
        </Button>
      </form>
      {showResults && (
        // One region with a stable shape: old results stay (dimmed) until new ones arrive, the
        // empty state and the loading row are exactly one result row tall, and the message box
        // keeps its space even with no results, so the card doesn't jump while typing.
        <div aria-busy={searching} className="flex flex-col gap-3">
          <ul aria-live="polite" className={cn("flex flex-col gap-2 transition-opacity duration-150", searching && hits && "opacity-60")}>
            {hits === null ? (
              // also covers the 300 ms before the first request goes out
              !error && (
                <li aria-hidden className="flex min-h-16 items-center gap-3 rounded-2xl bg-muted/40 p-3">
                  <span className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
                  <span className="flex flex-1 flex-col gap-1.5">
                    <span className="h-3.5 w-2/5 animate-pulse rounded bg-muted" />
                    <span className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                  </span>
                </li>
              )
            ) : hits.length === 0 ? (
              <li className="flex min-h-16 items-center gap-3 rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background/70">
                  <SearchX className="size-4" />
                </span>
                {t("onb.noneFound")}
              </li>
            ) : (
              hits.map((h) => (
                <li key={h.id} className="flex min-h-16 items-center gap-3 rounded-2xl bg-card p-3 shadow-card ring-1 ring-foreground/[0.06]">
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
              ))
            )}
          </ul>
          <div className={cn(!canMessage && "invisible")} aria-hidden={!canMessage}>
            <Field label={t("onb.msg")} htmlFor="join-msg">
              <Textarea id="join-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} placeholder={t("onb.msgPh")} disabled={!canMessage} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
