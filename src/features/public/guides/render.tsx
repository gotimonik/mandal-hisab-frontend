import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Clock, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconChip } from "@/components/app/bits";
import { categoryOf, readMinutes, slugify, type Guide, type GuideBlock } from "./index";

/** Render **bold** and [text](/path) inside a string. */
export function Rich({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<b key={i++} className="font-semibold text-foreground">{m[1]}</b>);
    else {
      const href = m[3];
      parts.push(
        href.startsWith("/") ? (
          <Link key={i++} href={href}>
            {m[2]}
          </Link>
        ) : (
          <a key={i++} href={href} target="_blank" rel="noopener noreferrer">
            {m[2]}
          </a>
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const TIP = {
  tip: { icon: <Lightbulb />, cls: "border-emerald-500/30 bg-emerald-500/[0.06]", tone: "emerald" },
  note: { icon: <Info />, cls: "border-sky-500/30 bg-sky-500/[0.06]", tone: "sky" },
  warn: { icon: <AlertTriangle />, cls: "border-amber-500/40 bg-amber-500/[0.08]", tone: "amber" },
} as const;

function Block({ b }: { b: GuideBlock }) {
  switch (b.type) {
    case "p":
      return (
        <p>
          <Rich text={b.text} />
        </p>
      );
    case "h2":
      return <h2 id={slugify(b.text)} className="scroll-mt-24">{b.text}</h2>;
    case "h3":
      return <h3>{b.text}</h3>;
    case "list":
      return (
        <ul>
          {b.items.map((it) => (
            <li key={it}>
              <Rich text={it} />
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="mt-5 flex list-none! flex-col gap-3 pl-0!">
          {b.items.map((s, n) => (
            <li key={s.title} className="mt-0! flex gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
              <span className="bg-hero flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white">{n + 1}</span>
              <div className="min-w-0">
                <p className="mt-0! font-semibold text-foreground">{s.title}</p>
                {s.text && (
                  <p className="mt-1! text-sm leading-6 text-muted-foreground">
                    <Rich text={s.text} />
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      );
    case "tip": {
      const t = TIP[b.tone ?? "tip"];
      return (
        <aside className={cn("mt-6 flex gap-3 rounded-2xl border p-4", t.cls)}>
          <IconChip tone={t.tone} size="sm">
            {t.icon}
          </IconChip>
          <div className="min-w-0">
            <p className="mt-0! font-semibold text-foreground">{b.title}</p>
            <p className="mt-1! text-sm leading-6">
              <Rich text={b.text} />
            </p>
          </div>
        </aside>
      );
    }
    case "table":
      return (
        <figure className="mt-5">
          <div className="overflow-x-auto rounded-2xl ring-1 ring-foreground/10">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead className="bg-secondary/60">
                <tr>
                  {b.head.map((h, i) => (
                    <th key={i} scope="col" className="px-3 py-2.5 font-semibold text-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i} className="border-t border-foreground/[0.07] align-top">
                    {r.map((c, j) => (
                      <td key={j} className={cn("px-3 py-2.5", j === 0 && "font-medium text-foreground")}>
                        <Rich text={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.caption && <figcaption className="mt-2 text-xs leading-5 text-muted-foreground">{b.caption}</figcaption>}
        </figure>
      );
  }
}

export function GuideBody({ guide }: { guide: Guide }) {
  return (
    <>
      {guide.body.map((b, i) => (
        <Block key={i} b={b} />
      ))}
    </>
  );
}

/** Card linking to a guide (index, related guides, home page). */
export function GuideCard({ guide, className }: { guide: Guide; className?: string }) {
  const cat = categoryOf(guide);
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className={cn("group flex h-full flex-col gap-2 rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] transition hover:-translate-y-0.5 hover:ring-primary/30", className)}
    >
      <p className="text-xs font-bold tracking-wider text-primary uppercase">{cat.title}</p>
      <h3 className="text-base leading-snug font-bold text-balance group-hover:text-primary">{guide.title}</h3>
      <p className="line-clamp-3 text-sm text-pretty text-muted-foreground">{guide.description}</p>
      <p className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {readMinutes(guide)} min read
        </span>
        <span>{guide.audience}</span>
        <ArrowRight className="ml-auto size-4 text-primary opacity-0 transition group-hover:opacity-100" />
      </p>
    </Link>
  );
}
