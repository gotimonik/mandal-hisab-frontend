import { ArrowDownToLine, HandCoins, PiggyBank, UserPlus, Users, Wallet } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";

/** A pure-markup picture of the app's dashboard. All figures are sample data. */
export function PhoneMockup({ className }: { className?: string }) {
  const tiles: { label: string; tone: Tone; icon: React.ReactNode }[] = [
    { label: "Collect", tone: "indigo", icon: <HandCoins /> },
    { label: "Receive", tone: "orange", icon: <ArrowDownToLine /> },
    { label: "Withdraw", tone: "rose", icon: <Wallet /> },
    { label: "Member", tone: "sky", icon: <UserPlus /> },
  ];
  return (
    <div className={cn("mx-auto w-full max-w-[18.5rem]", className)} aria-label="Illustration of the MandalHisab dashboard with sample data" role="img">
      <div className="rounded-[2.4rem] bg-zinc-950 p-2.5 shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <div className="relative overflow-hidden rounded-[1.9rem] bg-background text-foreground">
          <div aria-hidden className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-foreground/15" />
          <div className="flex flex-col gap-3 p-3.5 pt-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium text-muted-foreground">Shree Ganesh Mandal · FY 2026-27</p>
              <p className="text-base font-bold tracking-tight">Namaste, Ramesh</p>
            </div>
            <div className="bg-hero relative overflow-hidden rounded-2xl p-3 text-white">
              <div aria-hidden className="absolute -top-6 -right-6 size-20 rounded-full bg-white/10" />
              <p className="text-[10px] text-white/85">Hapta collected in October</p>
              <div className="mt-0.5 flex items-end justify-between gap-2">
                <p className="text-2xl font-extrabold tabular-nums">₹38,000</p>
                <span className="rounded-lg bg-white/15 px-1.5 py-0.5 text-xs font-bold">76%</span>
              </div>
              <p className="text-[10px] text-white/80">of ₹50,000 expected</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[76%] rounded-full bg-gradient-to-r from-amber-300 to-yellow-200" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {tiles.map((t) => (
                <div key={t.label} className="flex min-w-0 flex-col items-center gap-1 rounded-xl bg-card p-1.5 shadow-card ring-1 ring-foreground/[0.06]">
                  <IconChip tone={t.tone} size="sm">
                    {t.icon}
                  </IconChip>
                  <span className="truncate text-[9px] font-semibold">{t.label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="min-w-0 rounded-xl bg-card p-2 shadow-card ring-1 ring-foreground/[0.06]">
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  Members <Users className="size-3 text-sky-500" />
                </div>
                <p className="text-sm font-bold tabular-nums">50</p>
              </div>
              <div className="min-w-0 rounded-xl bg-card p-2 shadow-card ring-1 ring-foreground/[0.06]">
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  Member savings <PiggyBank className="size-3 text-emerald-500" />
                </div>
                <p className="text-sm font-bold tabular-nums">₹6,12,400</p>
              </div>
            </div>
            <div className="rounded-xl bg-card p-2 shadow-card ring-1 ring-foreground/[0.06]">
              <p className="mb-1.5 text-[10px] font-bold">Due this month</p>
              {[
                ["Mahesh Patel", "₹1,000", "sky"],
                ["Kiran Shah", "₹500", "violet"],
                ["Jayesh Desai", "₹1,000", "emerald"],
              ].map(([n, a, tone]) => (
                <div key={n} className="flex items-center gap-2 py-1">
                  <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold", tone === "sky" ? "bg-sky-500/15 text-sky-600" : tone === "violet" ? "bg-violet-500/15 text-violet-600" : "bg-emerald-500/15 text-emerald-600")}>
                    {n
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[10px]">{n}</span>
                  <span className="text-[10px] font-bold tabular-nums">{a}</span>
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-[8px] font-semibold text-primary-foreground">Collect</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-white/70">Illustration · sample data</p>
    </div>
  );
}
