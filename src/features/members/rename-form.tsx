"use client";

import { useT } from "@/i18n/client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ClipboardPaste, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/app/field";
import { FormNote } from "@/components/app/form-bits";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate } from "@/app/actions/api";
import { cn } from "@/lib/utils";

export interface RenameRow {
  _id: string;
  membershipNumber: string;
  name: string;
  nameEnglish?: string | null;
}

/**
 * "M0003  અભિષેક ગોટી" per line (tab, comma, "=" or spaces after the number), or just names in
 * the order of the list → new names by member id.
 */
export function readNameList(text: string, rows: RenameRow[]): { names: Record<string, string>; unmatched: string[] } {
  const byNo = new Map(rows.map((r) => [r.membershipNumber.toUpperCase(), r._id]));
  const lines = text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((l) => l.trim())
    // blank lines and anything without a letter (``` from a copied message, ---, numbers alone)
    .filter((l) => /\p{L}/u.test(l) && !/^`+/.test(l));
  const numbered = (l: string) => /^([A-Za-z]*\d+)[\s,\t=:.)-]+(.+)$/.exec(l);
  const names: Record<string, string> = {};
  const unmatched: string[] = [];
  // with member numbers: each line goes to its own number; without: in the order of the list
  const byNumber = lines.some((l) => numbered(l) && byNo.has(numbered(l)![1].toUpperCase()));
  lines.forEach((l, i) => {
    if (byNumber) {
      const m = numbered(l);
      const id = m && byNo.get(m[1].toUpperCase());
      if (id) names[id] = m![2].trim();
      else unmatched.push(l);
    } else if (rows[i]) names[rows[i]._id] = l;
    else unmatched.push(l);
  });
  return { names, unmatched };
}

function PasteNames({ rows, onRead }: { rows: RenameRow[]; onRead: (names: Record<string, string>) => void }) {
  const close = useDialogClose();
  const t = useT();
  const [text, setText] = useState("");
  const read = useMemo(() => (text.trim() ? readNameList(text, rows) : null), [text, rows]);
  const count = read ? Object.keys(read.names).length : 0;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>
        {t("misc.names.pasteHelp")} <code>M0003 અભિષેક ગોટી</code>. {t("misc.names.pasteHelp2")}
      </FormNote>
      <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={"M0003 અભિષેક ગોટી\nM0024 આર્યન ગોટી"} />
      {read && (
        <p className={cn("text-xs", read.unmatched.length ? "text-amber-700" : "text-muted-foreground")}>
          {t("misc.names.matched", { n: count })}
          {read.unmatched.length ? t("misc.names.notMatched", { list: `${read.unmatched.slice(0, 3).join(" | ")}${read.unmatched.length > 3 ? " …" : ""}` }) : ""}
        </p>
      )}
      <Button
        size="lg"
        disabled={count === 0}
        onClick={() => {
          onRead(read!.names);
          close();
        }}
      >
        <ClipboardPaste /> {t("misc.names.fill", { n: count })}
      </Button>
    </div>
  );
}

export function RenameForm({ orgId, rows }: { orgId: string; rows: RenameRow[] }) {
  const router = useRouter();
  const t = useT();
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r._id, r.name])));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const changed = rows.filter((r) => (names[r._id] ?? "").trim().replace(/\s+/g, " ") !== r.name);
  const tooShort = changed.some((r) => (names[r._id] ?? "").trim().length < 2);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FormDialog trigger={<><ClipboardPaste /> {t("misc.names.paste")}</>} triggerVariant="outline" triggerSize="sm" title={t("misc.names.pasteTitle")} wide icon={<ClipboardPaste />} tone="sky">
          <PasteNames rows={rows} onRead={(n) => setNames((x) => ({ ...x, ...n }))} />
        </FormDialog>
        <span className="text-xs text-muted-foreground">{t("misc.names.searchNote")}</span>
      </div>
      <ol className="divide-y rounded-2xl bg-card shadow-card ring-1 ring-foreground/[0.06]">
        {rows.map((r) => {
          const isChanged = (names[r._id] ?? "").trim().replace(/\s+/g, " ") !== r.name;
          return (
            <li key={r._id} className={cn("grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-1 px-3 py-2 sm:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1.2fr)]", isChanged && "bg-emerald-500/5")}>
              <span className="font-mono text-xs text-muted-foreground">{r.membershipNumber}</span>
              <span className="truncate text-sm text-muted-foreground">
                {r.name}
                {r.nameEnglish && r.nameEnglish !== r.name ? ` (${r.nameEnglish})` : ""}
              </span>
              <Input aria-label={t("misc.names.newFor", { name: r.name })} value={names[r._id] ?? ""} onChange={(e) => setNames((x) => ({ ...x, [r._id]: e.target.value }))} className="col-span-2 sm:col-span-1" lang="gu" />
            </li>
          );
        })}
      </ol>
      <FormError message={error ?? (tooShort ? t("misc.names.tooShort") : null)} />
      <Button
        size="lg"
        className="h-12 rounded-2xl text-base sm:self-start sm:px-6"
        disabled={pending || changed.length === 0 || tooShort}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await apiMutate<{ renamed: number }>({ path: `/orgs/${orgId}/members/rename`, body: { items: changed.map((m) => ({ memberId: m._id, name: names[m._id].trim() })) } });
            if (!r.ok) return setError(r.error);
            toast.success(t("misc.names.changed", { n: r.data.renamed }));
            router.push(`/org/${orgId}/members`);
            router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {changed.length ? t("misc.names.save", { n: changed.length }) : t("misc.names.saveNone")}
      </Button>
    </div>
  );
}
