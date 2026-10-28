import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getOrg, getSchemes, can } from "@/lib/server/data";
import type { Installment, Paged } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { Pagination } from "@/components/app/pagination";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { InstallmentActionDialog } from "@/features/installments/installment-action";
import { SummaryBand } from "@/components/app/summary-band";
import { ChipLinks } from "@/components/app/chip-links";
import { MemberAvatar, ProgressBar } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { InstallmentGroups, type InstallmentGroup } from "@/features/installments/installment-groups";

export const metadata = { title: "Installments" };

const STATUSES = ["outstanding", "overdue", "pending", "partially_paid", "upcoming", "paid", "deferred", "waived", "cancelled"];
const CHIPS = [
  ["", "All"],
  ["outstanding", "Outstanding"],
  ["overdue", "Overdue"],
  ["upcoming", "Upcoming"],
  ["partially_paid", "Part paid"],
  ["paid", "Paid"],
] as const;
const pct = (i: Installment) => {
  const total = i.amountPaise + i.penaltyPaise;
  return total > 0 ? Math.min(100, Math.round(((i.paidPaise + i.penaltyPaidPaise) / total) * 100)) : 0;
};

export default async function InstallmentsPage({ params, searchParams }: PageProps<"/org/[orgId]/installments">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const f = {
    schemeId: typeof sp.schemeId === "string" ? sp.schemeId : "",
    memberId: typeof sp.memberId === "string" ? sp.memberId : "",
    status: typeof sp.status === "string" ? sp.status : "",
    from: typeof sp.from === "string" ? sp.from : "",
    to: typeof sp.to === "string" ? sp.to : "",
  };
  const page = Number(sp.page ?? 1) || 1;
  // "By scheme" / "By member" roll the installments up; drilling into a card opens the plain list.
  const view: "list" | "scheme" | "member" = sp.view === "scheme" || sp.view === "member" ? sp.view : "list";
  const grouped = view !== "list";
  const [org, schemes, data, groups] = await Promise.all([
    getOrg(orgId),
    getSchemes(orgId),
    grouped ? null : api<Paged<Installment>>(`/orgs/${orgId}/installments${qs({ ...f, page, pageSize: 50 })}`),
    grouped
      ? api<Paged<InstallmentGroup> & { totals: { outstandingPaise: number; overduePaise: number; paidPaise: number; paidAheadPaise: number } }>(
          `/orgs/${orgId}/installments/groups${qs({ by: view, schemeId: f.schemeId, memberId: f.memberId, from: f.from, to: f.to, page, pageSize: 30 })}`,
        )
      : null,
  ]);
  const manage = can(org, "installments.manage");
  const href = (over: Record<string, string>) => `/org/${orgId}/installments${qs({ ...f, view: view === "list" ? "" : view, ...over })}`;
  const VIEWS = [
    { key: "list", label: "All", href: href({ view: "", page: "" }) },
    { key: "scheme", label: "By scheme", href: href({ view: "scheme", page: "", status: "" }) },
    { key: "member", label: "By member", href: href({ view: "member", page: "", status: "" }) },
  ];
  const memberName = f.memberId ? (data?.items[0]?.member?.name ?? groups?.items.find((g) => g._id === f.memberId)?.name) : undefined;
  const scheme = schemes.find((x) => x._id === f.schemeId);
  const action = (i: Installment) => (manage && i.status !== "paid" && i.state !== "cancelled" ? <InstallmentActionDialog inst={i} /> : null);
  const reason = (i: Installment) => i.stateReason && <div className="max-w-48 truncate text-xs text-muted-foreground" title={i.stateReason}>{i.stateReason}</div>;

  const header = <PageHeader title="Installments" description="Every hapta due, member by member. Status comes from verified payments — use the adjust button to change a due date, amount, or waive one." />;
  const viewChips = (
    <nav aria-label="View" className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1 text-sm font-semibold sm:inline-grid sm:w-auto">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={v.href}
          aria-current={v.key === view ? "page" : undefined}
          className={cn("rounded-xl px-3 py-2 text-center whitespace-nowrap transition-colors", v.key === view ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  );
  const scopeChips = (f.schemeId || f.memberId) && (
    <div className="mb-3 flex flex-wrap gap-2 text-xs">
      {scheme && (
        <Link href={href({ schemeId: "", page: "" })} className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 font-semibold text-violet-700 dark:text-violet-300">
          {scheme.name} <X className="size-3" />
        </Link>
      )}
      {f.memberId && (
        <Link href={href({ memberId: "", page: "" })} className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 font-semibold text-sky-700 dark:text-sky-300">
          {memberName ?? "Member"} <X className="size-3" />
        </Link>
      )}
    </div>
  );

  if (groups) {
    return (
      <>
        {header}
        <SummaryBand
          tone={groups.totals.overduePaise > 0 ? "warm" : "indigo"}
          icon={<ClipboardList />}
          label={scheme ? `Due now · ${scheme.name}` : "Due now"}
          value={<Money paise={groups.totals.outstandingPaise} />}
          sub={`${groups.total} ${view === "scheme" ? "scheme" : "member"}${groups.total === 1 ? "" : "s"}`}
          stats={[
            { label: "Overdue", value: <Money paise={groups.totals.overduePaise} short /> },
            { label: "Collected", value: <Money paise={groups.totals.paidPaise} short /> },
            { label: "Paid ahead", value: <Money paise={groups.totals.paidAheadPaise} short /> },
          ]}
        />
        {viewChips}
        {scopeChips}
        {groups.items.length === 0 ? (
          <EmptyState icon={<ClipboardList />} title="No installments yet" description="Enrol members in a hapta scheme to see them here." />
        ) : (
          <InstallmentGroups
            by={view as "scheme" | "member"}
            items={groups.items}
            hrefFor={(g) => href(view === "scheme" ? { view: "", schemeId: g._id, page: "" } : { view: "", memberId: g._id, page: "" })}
          />
        )}
        <Pagination page={groups.page} pageSize={groups.pageSize} total={groups.total} baseHref={`/org/${orgId}/installments`} params={{ ...f, view }} />
      </>
    );
  }
  if (!data) return null;
  const outstanding = data.items.reduce((s, i) => s + i.outstandingPaise, 0);
  const overdue = data.items.filter((i) => i.status === "overdue");

  return (
    <>
      <PageHeader title="Installments" description="Every hapta due, member by member. Status comes from verified payments — use the adjust button to change a due date, amount, or waive one." />
      <SummaryBand
        tone={overdue.length > 0 ? "warm" : "indigo"}
        icon={<ClipboardList />}
        label={scheme ? `Still to collect · ${scheme.name}` : "Still to collect"}
        value={<Money paise={outstanding} />}
        sub={`${data.total} installment${data.total === 1 ? "" : "s"}${data.total > data.items.length ? ` · total for the ${data.items.length} on this page` : ""}`}
        stats={[
          { label: "Overdue", value: overdue.length },
          { label: "Paid", value: data.items.filter((i) => i.status === "paid").length },
          { label: "Due", value: data.items.filter((i) => i.outstandingPaise > 0).length },
        ]}
      />
      {viewChips}
      {scopeChips}
      <ChipLinks label="Status" current={f.status} items={CHIPS.map(([k, l]) => ({ key: k, label: l, href: href({ status: k, page: "" }) }))} />
      <FilterBar resetHref={`/org/${orgId}/installments`}>
        <FilterField label="Scheme">
          <NativeSelect name="schemeId" defaultValue={f.schemeId}>
            <option value="">All schemes</option>
            {schemes.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label="Status">
          <NativeSelect name="status" defaultValue={f.status}>
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label="Due from">
          <Input type="date" name="from" defaultValue={f.from} />
        </FilterField>
        <FilterField label="Due to">
          <Input type="date" name="to" defaultValue={f.to} />
        </FilterField>
        {f.memberId && <input type="hidden" name="memberId" value={f.memberId} />}
      </FilterBar>
      {data.items.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="No installments match" description="Try another status, scheme or date range." />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Installments">
            {data.items.map((i) => (
              <li key={i._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", i.status === "overdue" && "ring-2 ring-rose-400/40")}>
                <div className="flex items-start gap-3">
                  <MemberAvatar name={i.member?.name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/org/${orgId}/members/${i.memberId}`} className="block truncate font-semibold hover:underline">
                      {i.member?.name ?? "—"}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {i.periodLabel} · {i.schemeName}
                    </p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(i.dueDate)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money paise={i.outstandingPaise > 0 ? i.outstandingPaise : i.amountPaise + i.penaltyPaise} className={cn("font-bold", i.outstandingPaise > 0 && i.status === "overdue" && "text-destructive")} />
                    <StatusBadge status={i.status} />
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <ProgressBar value={pct(i)} className="h-1.5 flex-1" />
                  <span className="shrink-0 tabular-nums">
                    <Money paise={i.paidPaise + i.penaltyPaidPaise} /> / <Money paise={i.amountPaise + i.penaltyPaise} />
                  </span>
                </div>
                {i.penaltyPaise > 0 && <p className="mt-1 text-xs text-muted-foreground">Includes a late fee</p>}
                {reason(i)}
                {action(i) && <div className="mt-2 flex justify-end">{action(i)}</div>}
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="min-w-44">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    {manage && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((i) => (
                    <TableRow key={i._id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar name={i.member?.name ?? "?"} size="sm" />
                          <div className="min-w-0">
                            <Link href={`/org/${orgId}/members/${i.memberId}`} className="font-semibold hover:underline">
                              {i.member?.name ?? "—"}
                            </Link>
                            <div className="text-xs text-muted-foreground">{i.member?.membershipNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{i.periodLabel}</div>
                        <div className="text-xs text-muted-foreground">{i.schemeName}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(i.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <ProgressBar value={pct(i)} className="h-1.5 w-20" />
                          <span className="tabular-nums text-muted-foreground">
                            <Money paise={i.paidPaise + i.penaltyPaidPaise} /> / <Money paise={i.amountPaise + i.penaltyPaise} />
                          </span>
                        </div>
                        {i.penaltyPaise > 0 && <div className="text-xs text-muted-foreground">incl. late fee</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={i.outstandingPaise} className={cn("font-semibold", i.outstandingPaise === 0 && "font-normal text-muted-foreground", i.status === "overdue" && "text-destructive")} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={i.status} />
                        {reason(i)}
                      </TableCell>
                      {manage && <TableCell className="text-right">{action(i)}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/installments`} params={f} />
    </>
  );
}
