"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Bell, CalendarDays, Database, Landmark, Building2, SlidersHorizontal, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { Key } from "@/i18n/core";
import type { SettingsTab } from "./settings-tab-ids";

/**
 * Mandal settings, one section at a time: a sticky row of tabs at the top instead of one long
 * page. Every section stays on the page (hidden, not removed), so the one settings form keeps
 * what was typed in other tabs and a single Save saves it all.
 */
export const SETTINGS_TABS: { id: SettingsTab; label: Key; icon: typeof CalendarDays }[] = [
  { id: "hapta", label: "setp.tabs.hapta", icon: CalendarDays },
  { id: "money", label: "setp.tabs.money", icon: Landmark },
  { id: "mandal", label: "setp.tabs.mandal", icon: Building2 },
  { id: "team", label: "setp.tabs.team", icon: Users },
  { id: "notifications", label: "setp.tabs.notifications", icon: Bell },
  { id: "more", label: "setp.tabs.more", icon: SlidersHorizontal },
  { id: "data", label: "setp.tabs.data", icon: Database },
];

const Ctx = createContext<SettingsTab>("hapta");

export function SettingsTabs({ initial, alerts = {}, children }: { initial: SettingsTab; alerts?: Partial<Record<SettingsTab, boolean>>; children: ReactNode }) {
  const t = useT();
  const [tab, setTab] = useState<SettingsTab>(initial);
  const bar = useRef<HTMLDivElement>(null);

  const choose = (id: SettingsTab) => {
    setTab(id);
    // keep the tab in the address, so reloading or coming back opens the same section
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(window.history.state, "", url);
    // scrolled down into a long section: jump back to the top of the new one (just under the
    // app's header on phones)
    const mark = bar.current;
    if (mark) {
      const top = mark.getBoundingClientRect().top + window.scrollY - (window.innerWidth >= 1024 ? 8 : 64);
      if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  };

  return (
    <Ctx.Provider value={tab}>
      <div ref={bar} aria-hidden />
      <div className="no-print sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 mb-4 bg-background/90 px-4 py-2 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:px-1 lg:top-2">
        <nav aria-label={t("setp.tabs.aria")} role="tablist" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`settings-${id}`}
                onClick={() => choose(id)}
                className={cn(
                  "relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/70 text-foreground/70 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {t(label)}
                {alerts[id] && !active && <span className="absolute top-1 right-1 size-2 rounded-full bg-amber-500" aria-label={t("setp.tabs.attention")} />}
              </button>
            );
          })}
        </nav>
      </div>
      {children}
    </Ctx.Provider>
  );
}

/** A part of one (or more) tabs. Hidden — not removed — when another tab is open. */
export function SettingsPanel({ tab, className, children }: { tab: SettingsTab | SettingsTab[]; className?: string; children: ReactNode }) {
  const active = useContext(Ctx);
  const tabs = Array.isArray(tab) ? tab : [tab];
  const shown = tabs.includes(active);
  return (
    <div
      id={tabs.length === 1 ? `settings-${tabs[0]}` : undefined}
      role={tabs.length === 1 ? "tabpanel" : undefined}
      hidden={!shown}
      className={cn(shown && "animate-in fade-in-0 duration-200", className)}
    >
      {children}
    </div>
  );
}
