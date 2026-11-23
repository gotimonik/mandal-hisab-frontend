"use client";

import { useT } from "@/i18n/client";
import { useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowDownAZ, ArrowUp, CheckCircle2, GripVertical, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/app/field";
import { MemberAvatar } from "@/components/app/bits";
import { apiMutate } from "@/app/actions/api";
import { cn } from "@/lib/utils";

export interface OrderRow {
  _id: string;
  membershipNumber: string;
  name: string;
}

/** `list` with the item at `from` moved to `to`. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Put the members in the Mandal's own order: drag a row by its handle (mouse or finger), or use
 * the ↑ ↓ buttons. Lists, the hisab sheet and the monthly hapta follow the saved order.
 */
export function ReorderForm({ orgId, rows }: { orgId: string; rows: OrderRow[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(rows);
  const t = useT();
  const [drag, setDrag] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const items = useRef(new Map<string, HTMLLIElement>());
  const changed = order.some((r, i) => r._id !== rows[i]._id);

  const move = (from: number, to: number) => setOrder((o) => moveItem(o, from, to));

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, i: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(i);
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (drag === null) return;
    const y = e.clientY;
    // scroll while dragging near the top / bottom of the screen
    if (y < 90) window.scrollBy(0, -14);
    else if (y > window.innerHeight - 90) window.scrollBy(0, 14);
    let to = drag;
    order.forEach((r, k) => {
      const el = items.current.get(r._id);
      if (!el || k === drag) return;
      const box = el.getBoundingClientRect();
      const mid = box.top + box.height / 2;
      if (k < drag && y < mid && k < to) to = k;
      if (k > drag && y > mid && k > to) to = k;
    });
    if (to !== drag) {
      move(drag, to);
      setDrag(to);
    }
  };
  const onUp = () => setDrag(null);

  const sortBy = (key: "name" | "number") =>
    setOrder((o) => [...o].sort((a, b) => (key === "name" ? a.name.localeCompare(b.name) : a.membershipNumber.localeCompare(b.membershipNumber, "en", { numeric: true }))));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => sortBy("number")}>
          <Hash /> {t("misc.order.byNo")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => sortBy("name")}>
          <ArrowDownAZ /> A → Z
        </Button>
        <span className="text-xs text-muted-foreground">{t("misc.order.drag")} <GripVertical className="inline size-3.5" /> {t("misc.order.arrows")}</span>
      </div>
      <ol className="flex flex-col gap-1.5" aria-label={t("misc.order.aria")}>
        {order.map((r, i) => (
          <li
            key={r._id}
            ref={(el) => {
              if (el) items.current.set(r._id, el);
              else items.current.delete(r._id);
            }}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl bg-card px-2 py-2 shadow-card ring-1 ring-foreground/[0.06] transition-shadow",
              drag === i && "relative z-10 scale-[1.01] shadow-lg ring-2 ring-primary/40",
            )}
          >
            <button
              type="button"
              aria-label={`Drag ${r.name}`}
              className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-muted-foreground hover:bg-muted active:cursor-grabbing"
              onPointerDown={(e) => onDown(e, i)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <GripVertical className="size-5" />
            </button>
            <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums text-muted-foreground">{i + 1}</span>
            <MemberAvatar name={r.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{r.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{r.membershipNumber}</span>
            </span>
            <Button variant="ghost" size="icon-sm" aria-label={t("misc.order.up", { name: r.name })} disabled={i === 0} onClick={() => move(i, i - 1)}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={t("misc.order.down", { name: r.name })} disabled={i === order.length - 1} onClick={() => move(i, i + 1)}>
              <ArrowDown />
            </Button>
          </li>
        ))}
      </ol>
      <FormError message={error} />
      <Button
        size="lg"
        className="sticky bottom-3 h-12 rounded-2xl text-base shadow-lg sm:self-start sm:px-6"
        disabled={pending || !changed}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await apiMutate({ path: `/orgs/${orgId}/members/order`, body: { memberIds: order.map((m) => m._id) } });
            if (!r.ok) return setError(r.error);
            toast.success(t("misc.order.saved"));
            router.push(`/org/${orgId}/members`);
            router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {t("misc.order.save")}
      </Button>
    </div>
  );
}
