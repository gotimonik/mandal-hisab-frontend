"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";

export type RoleInfo = { icon: ReactNode; tone: Tone; role: string; who: string; points: string[] };

function RoleCard({ r, className }: { r: RoleInfo; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] md:gap-4 md:rounded-3xl md:p-5", className)}>
      <div className="flex items-center gap-3">
        <IconChip tone={r.tone}>{r.icon}</IconChip>
        <div className="min-w-0">
          <h3 className="text-base font-bold md:text-lg">{r.role}</h3>
          <p className="text-xs text-muted-foreground">{r.who}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm md:gap-2">
        {r.points.map((p) => (
          <li key={p} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Phones: Admin / Manager / Member tabs showing one whole card. Wider screens: all three side by side. */
export function RoleTabs({ roles }: { roles: RoleInfo[] }) {
  const [active, setActive] = useState(0);
  const r = roles[active];
  return (
    <>
      <div className="md:hidden">
        <div role="tablist" aria-label="Roles" className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-card p-1 shadow-card ring-1 ring-foreground/[0.06]">
          {roles.map((x, i) => (
            <button
              key={x.role}
              type="button"
              role="tab"
              id={`role-tab-${i}`}
              aria-selected={i === active}
              aria-controls="role-panel"
              onClick={() => setActive(i)}
              className={cn("rounded-xl py-2 text-sm font-semibold transition-colors", i === active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "text-muted-foreground hover:text-foreground")}
            >
              {x.role}
            </button>
          ))}
        </div>
        <div role="tabpanel" id="role-panel" aria-labelledby={`role-tab-${active}`}>
          <RoleCard r={r} />
        </div>
      </div>
      <div className="hidden grid-cols-3 gap-4 md:grid">
        {roles.map((x) => (
          <RoleCard key={x.role} r={x} />
        ))}
      </div>
    </>
  );
}
