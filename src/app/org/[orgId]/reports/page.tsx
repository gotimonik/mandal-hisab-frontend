import Link from "next/link";
import { ArrowRight, CalendarRange, Wallet } from "lucide-react";
import { getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { IconChip, SectionTitle } from "@/components/app/bits";
import type { Tone } from "@/lib/tones";
import { REPORTS } from "@/features/reports-meta";
import { getT } from "@/i18n/server";
import { reportLook } from "@/features/reports/look";

export const metadata = { title: "Reports" };

function ReportTile({ href, tone, icon, title, description }: { href: string; tone: Tone; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex h-full items-start gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <IconChip tone={tone}>{icon}</IconChip>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 font-semibold">
          {title}
          <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{description}</span>
      </span>
    </Link>
  );
}

export default async function ReportsPage({ params }: PageProps<"/org/[orgId]/reports">) {
  const { orgId } = await params;
  const { t } = await getT();
  const org = await getOrg(orgId);
  const list = REPORTS.filter((r) => org.myPermissions.includes(r.permission));
  return (
    <>
      <PageHeader title={t("rep.title")} description={t("rep.desc")} />

      <SectionTitle>{t("rep.everyMonth")}</SectionTitle>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ReportTile
          href={`/org/${orgId}/monthly/report`}
          tone="indigo"
          icon={<CalendarRange />}
          title={t("rep.monthly")}
          description={t("rep.monthlyDesc")}
        />
        <ReportTile href={`/org/${orgId}/cashbook`} tone="emerald" icon={<Wallet />} title={t("rep.cashbook")} description={t("rep.cashbookDesc")} />
      </div>

      {list.length > 0 && (
        <>
          <SectionTitle>{t("rep.all")}</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((r) => {
              const lk = reportLook(r.kind);
              return <ReportTile key={r.kind} href={`/org/${orgId}/reports/${r.kind}`} tone={lk.tone} icon={lk.icon} title={t(r.title)} description={t(r.description)} />;
            })}
          </div>
        </>
      )}

      <p className="mt-6 rounded-2xl bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">{t("rep.memberNote")}</p>
    </>
  );
}
