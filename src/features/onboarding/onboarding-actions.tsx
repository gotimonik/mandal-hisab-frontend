"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { JoinOrgForm } from "./join-org-form";
import { CreateOrgForm } from "./create-org-form";

type Tab = "join" | "create";

/** Join an existing Mandal or start a new one — one switch instead of two long cards. Both stay mounted so typed input survives switching. */
export function OnboardingActions({ defaultTab = "join" }: { defaultTab?: Tab }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "join", label: t("onb.tabJoin"), icon: <Search /> },
    { key: "create", label: t("onb.tabCreate"), icon: <Plus /> },
  ];
  return (
    <section className="rounded-3xl bg-card p-3 shadow-card ring-1 ring-foreground/[0.06] sm:p-4">
      <div role="tablist" aria-label={t("onb.tabJoin")} className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            id={`onb-tab-${x.key}`}
            aria-selected={tab === x.key}
            aria-controls={`onb-panel-${x.key}`}
            onClick={() => setTab(x.key)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors [&_svg]:size-4",
              tab === x.key ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.icon}
            <span className="truncate">{x.label}</span>
          </button>
        ))}
      </div>
      <div id="onb-panel-join" role="tabpanel" aria-labelledby="onb-tab-join" hidden={tab !== "join"} className="px-1 pt-4 pb-1">
        <p className="mb-3 text-sm text-muted-foreground">{t("onb.joinDesc")}</p>
        <JoinOrgForm />
      </div>
      <div id="onb-panel-create" role="tabpanel" aria-labelledby="onb-tab-create" hidden={tab !== "create"} className="px-1 pt-4 pb-1">
        <p className="mb-3 text-sm text-muted-foreground">{t("onb.createDesc")}</p>
        <CreateOrgForm />
      </div>
    </section>
  );
}
