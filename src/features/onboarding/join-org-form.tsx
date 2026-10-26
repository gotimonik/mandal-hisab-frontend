"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/app/field";
import { apiMutate, apiRead } from "@/app/actions/api";

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

const STATUS_TEXT: Record<string, string> = { active: "You're a member", pending: "Request sent", deactivated: "Access removed", rejected: "" };

/** Find a Mandal by its name or its join code, then request to join (the admin approves). */
export function JoinOrgForm() {
  const router = useRouter();
  const [q, setQ] = useState("");
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
      toast.success(`Request sent to ${h.name}. An admin will review it.`);
      setHits((list) => list?.map((x) => (x.id === h.id ? { ...x, myStatus: "pending" } : x)) ?? null);
      router.refresh();
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
        <Input aria-label="Mandal name or join code" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mandal name or join code" maxLength={100} />
        <Button type="submit" variant="outline" disabled={pending || q.trim().length < 2}>
          {pending && !joining ? <Loader2 className="animate-spin" /> : <Search />} Find
        </Button>
      </form>
      {hits && hits.length === 0 && <p className="text-sm text-muted-foreground">No Mandal found. Check the spelling, or ask the admin for the join code.</p>}
      {hits && hits.length > 0 && (
        <>
          <ul className="divide-y rounded-lg border">
            {hits.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium">{h.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{[h.city, h.description].filter(Boolean).join(" · ") || (h.viaCode ? "Matched by join code" : "")}</p>
                </div>
                {h.myStatus && h.myStatus !== "rejected" ? (
                  <span className="shrink-0 text-xs text-muted-foreground">{STATUS_TEXT[h.myStatus] ?? h.myStatus}</span>
                ) : h.acceptsJoinRequests ? (
                  <Button size="sm" onClick={() => join(h)} disabled={pending}>
                    {joining === h.id && <Loader2 className="animate-spin" />} Request to join
                  </Button>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">Invitation only</span>
                )}
              </li>
            ))}
          </ul>
          <Field label="Message to the admin (optional)" htmlFor="join-msg">
            <Textarea id="join-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} placeholder="e.g. I'm Ramesh bhai's son" />
          </Field>
        </>
      )}
    </div>
  );
}
