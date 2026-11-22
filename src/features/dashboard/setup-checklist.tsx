"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Rocket } from "lucide-react";
import { IconChip, ProgressBar } from "@/components/app/bits";
import { cn } from "@/lib/utils";

export type SetupStep = {
  key: string;
  done: boolean;
  title: string;
  subtitle: string;
  href?: string;
  optional?: boolean;
  /** a second, smaller link under the step (e.g. "bring in the old hisab") */
  extra?: { label: string; href: string };
};

type Labels = { title: string; sub: string; hide: string; optional: string };

const storeKey = (orgId: string) => `mh.setupHidden.${orgId}`;
const EVENT = "mh-setup-hidden";
function readHidden(orgId: string) {
  try {
    return localStorage.getItem(storeKey(orgId)) === "1";
  } catch {
    return false;
  }
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * "Get your Mandal started": what a new Mandal's admin still has to do, worked out from real data so
 * each step ticks itself off. Gone once every required step is done, or when the admin hides it.
 */
export function SetupChecklist({ orgId, steps, labels, video }: { orgId: string; steps: SetupStep[]; labels: Labels; video?: ReactNode }) {
  // Hidden on the server and until the device's choice is read, so a hidden card never flashes in.
  const hidden = useSyncExternalStore(subscribe, () => readHidden(orgId), () => true);

  const done = steps.filter((s) => s.done).length;
  if (hidden || steps.filter((s) => !s.optional).every((s) => s.done)) return null;
  const next = steps.find((s) => !s.done && !s.optional)?.key;

  const hide = () => {
    try {
      localStorage.setItem(storeKey(orgId), "1");
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <section aria-label={labels.title} className="mb-4 rounded-2xl bg-card p-4 shadow-card ring-2 ring-primary/20 sm:p-5">
      <div className="flex items-start gap-3">
        <IconChip tone="indigo">
          <Rocket />
        </IconChip>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{labels.title}</h2>
          <p className="text-xs text-muted-foreground">{labels.sub.replace("{done}", String(done)).replace("{total}", String(steps.length))}</p>
        </div>
        <button type="button" onClick={hide} className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted">
          {labels.hide}
        </button>
      </div>
      <ProgressBar value={(done / steps.length) * 100} className="mt-3 h-2" label={labels.title} />
      {video && <div className="mt-2">{video}</div>}
      <ol className="mt-3 flex flex-col gap-1">
        {steps.map((s, i) => {
          const isNext = s.key === next;
          const body = (
            <>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  s.done ? "bg-emerald-500 text-white" : isNext ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {s.done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-semibold", s.done && "text-muted-foreground line-through decoration-1")}>
                  {s.title}
                  {s.optional && !s.done && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground no-underline">{labels.optional}</span>}
                </span>
                {!s.done && <span className="block text-xs text-muted-foreground">{s.subtitle}</span>}
              </span>
              {!s.done && s.href && <ArrowRight className={cn("size-4 shrink-0", isNext ? "text-primary" : "text-muted-foreground")} />}
            </>
          );
          return (
            <li key={s.key} className={cn("rounded-xl", isNext && "bg-primary/5 ring-1 ring-primary/15")}>
              {!s.done && s.href ? (
                <Link href={s.href} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60 active:bg-muted">
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-2 py-2.5">{body}</div>
              )}
              {!s.done && s.extra && (
                <Link href={s.extra.href} className="mb-2 ml-12 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  {s.extra.label} <ArrowRight className="size-3" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
