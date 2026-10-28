import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getAccounts, getOrg, getSchemes } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { PrintButton } from "@/components/app/print-button";
import { Input } from "@/components/ui/input";

import { METHOD_LABEL, formatDate, label } from "@/lib/format";
import { REPORTS } from "@/features/reports-meta";
import { renderReport } from "@/features/reports/renderers";
import { reportLook } from "@/features/reports/look";
import { IconChip } from "@/components/app/bits";
import Link from "next/link";
import { ExportCsvButton } from "@/components/app/export-csv-button";

export default async function ReportPage({ params, searchParams }: PageProps<"/org/[orgId]/reports/[kind]">) {
  const { orgId, kind } = await params;
  const meta = REPORTS.find((r) => r.kind === kind);
  if (!meta) notFound();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { from: str("from"), to: str("to"), asOf: str("asOf"), groupBy: str("groupBy") || "month", schemeId: str("schemeId"), eventName: str("eventName"), accountId: str("accountId"), method: str("method") };
  const org = await getOrg(orgId);
  if (!org.myPermissions.includes(meta.permission)) notFound();
  const [data, schemes, accounts] = await Promise.all([
    api<Record<string, unknown>>(`/orgs/${orgId}/reports/${kind}${qs(f)}`),
    meta.filters.includes("scheme") ? getSchemes(orgId) : Promise.resolve([]),
    meta.filters.includes("account") ? getAccounts(orgId) : Promise.resolve([]),
  ]);
  const lk = reportLook(kind);
  const period = data.from && data.to ? `${formatDate(data.from as string)} – ${formatDate(data.to as string)}` : data.asOf ? `As of ${formatDate(data.asOf as string)}` : "";
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`/org/${orgId}/reports`} className="hover:underline">
            Reports
          </Link>
        }
        title={meta.title}
        description={`${org.name} · ${period}`}
        actions={
          <>
            <ExportCsvButton href={`/api/export${qs({ path: `/orgs/${orgId}/reports/${kind}`, ...f })}`}>
              <Download /> CSV
            </ExportCsvButton>
            <PrintButton />
          </>
        }
      />
      <section className="no-print mb-4 flex items-start gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
        <IconChip tone={lk.tone}>{lk.icon}</IconChip>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          {period && <p className="mt-1.5 inline-flex rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">{period}</p>}
        </div>
      </section>
      {meta.filters.length > 0 && (
        <FilterBar resetHref={`/org/${orgId}/reports/${kind}`}>
          {meta.filters.includes("range") && (
            <>
              <FilterField label="From">
                <Input type="date" name="from" defaultValue={f.from} />
              </FilterField>
              <FilterField label="To">
                <Input type="date" name="to" defaultValue={f.to} />
              </FilterField>
            </>
          )}
          {meta.filters.includes("asOf") && (
            <FilterField label="As of">
              <Input type="date" name="asOf" defaultValue={f.asOf} />
            </FilterField>
          )}
          {meta.filters.includes("groupBy") && (
            <FilterField label="Group by">
              <NativeSelect name="groupBy" defaultValue={f.groupBy}>
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter (FY)</option>
                <option value="year">Financial year</option>
              </NativeSelect>
            </FilterField>
          )}
          {meta.filters.includes("scheme") && (
            <FilterField label="Scheme">
              <NativeSelect name="schemeId" defaultValue={f.schemeId}>
                <option value="">All</option>
                {schemes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </FilterField>
          )}
          {meta.filters.includes("account") && (
            <FilterField label="Account">
              <NativeSelect name="accountId" defaultValue={f.accountId}>
                <option value="">All</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </NativeSelect>
            </FilterField>
          )}
          {meta.filters.includes("event") && (
            <FilterField label="Event">
              <Input name="eventName" defaultValue={f.eventName} />
            </FilterField>
          )}
          {meta.filters.includes("method") && (
            <FilterField label="Method">
              <NativeSelect name="method" defaultValue={f.method}>
                <option value="">All</option>
                {org.settings.paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {label(METHOD_LABEL, m)}
                  </option>
                ))}
              </NativeSelect>
            </FilterField>
          )}
        </FilterBar>
      )}
      <div className="hidden print:mb-4 print:block">
        <h2 className="text-lg font-semibold">
          {org.name} — {meta.title}
        </h2>
        <p className="text-sm">{period}</p>
      </div>
      {renderReport(kind, data, orgId)}
    </>
  );
}
