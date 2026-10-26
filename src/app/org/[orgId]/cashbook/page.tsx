import { BookOpenCheck } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { can, getAccounts, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { requestToday } from "@/lib/server/today";
import { CashEntryDialog } from "@/features/cashbook/cash-entry-dialog";

export const metadata = { title: "Cash book" };

interface CashBook {
  from: string | null;
  to: string;
  openingBalancePaise: number;
  summary: { haptaCollectedPaise: number; otherReceiptsPaise: number; withdrawalsPaidPaise: number; otherExpensesPaise: number; loansGivenPaise: number; loanPaymentsReceivedPaise: number; totalReceiptsPaise: number; totalPaymentsPaise: number };
  categories: { type: string; label: string; receiptsPaise: number; paymentsPaise: number; netPaise: number }[];
  lines: { date: string; number?: string; description: string; type: string; isReversal: boolean; memberName: string | null; accountName: string; receiptPaise: number; paymentPaise: number; balancePaise: number }[];
  closingBalancePaise: number;
}

export default async function CashBookPage({ params, searchParams }: PageProps<"/org/[orgId]/cashbook">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const today = await requestToday();
  const f = { from: str("from") || `${today.slice(0, 7)}-01`, to: str("to") || today, accountId: str("accountId") };
  const [org, book, accounts] = await Promise.all([getOrg(orgId), api<CashBook>(`/orgs/${orgId}/cashbook${qs(f)}`), getAccounts(orgId)]);
  const s = book.summary;
  const active = accounts.filter((a) => a.isActive);
  return (
    <>
      <PageHeader
        title="Cash book"
        description="Every rupee in and out, from recorded transactions only."
        actions={
          <>
            <a href={`/api/export${qs({ path: `/orgs/${orgId}/cashbook`, ...f })}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Download CSV
            </a>
            {can(org, "accounts.manage") && org.status === "active" && (
              <CashEntryDialog accounts={active.map((a) => ({ _id: a._id, name: a.name }))} categories={org.settings.expenseCategories.filter((c) => c.isActive).map((c) => ({ key: c.key, name: c.name }))} />
            )}
          </>
        }
      />
      <FilterBar resetHref={`/org/${orgId}/cashbook`}>
        <FilterField label="From">
          <Input type="date" name="from" defaultValue={f.from} />
        </FilterField>
        <FilterField label="To">
          <Input type="date" name="to" defaultValue={f.to} />
        </FilterField>
        {active.length > 1 && (
          <FilterField label="Account">
            <NativeSelect name="accountId" defaultValue={f.accountId}>
              <option value="">All cash & bank</option>
              {active.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
        )}
      </FilterBar>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Opening" value={<Money paise={book.openingBalancePaise} />} hint={formatDate(f.from)} />
        <StatCard label="Hapta collected" value={<Money paise={s.haptaCollectedPaise} />} tone="good" />
        <StatCard label="Upad interest & repayments" value={<Money paise={s.loanPaymentsReceivedPaise} />} tone="good" />
        <StatCard label="Other receipts" value={<Money paise={s.otherReceiptsPaise} />} />
        <StatCard label="Upad given" value={<Money paise={s.loansGivenPaise} />} />
        <StatCard label="Withdrawals paid" value={<Money paise={s.withdrawalsPaidPaise} />} />
        <StatCard label="Other expenses" value={<Money paise={s.otherExpensesPaise} />} />
        <StatCard label="Closing" value={<Money paise={book.closingBalancePaise} />} hint={formatDate(f.to)} tone={book.closingBalancePaise < 0 ? "bad" : "default"} />
      </div>
      {book.lines.length === 0 ? (
        <EmptyState icon={<BookOpenCheck />} title="No cash movements in this period" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Out</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/40">
                <TableCell className="hidden sm:table-cell" />
                <TableCell className="font-medium">
                  Opening balance <Money paise={book.openingBalancePaise} className="sm:hidden" />
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="hidden text-right font-medium sm:table-cell">
                  <Money paise={book.openingBalancePaise} />
                </TableCell>
              </TableRow>
              {book.lines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">{formatDate(l.date)}</TableCell>
                  <TableCell className="min-w-40 whitespace-normal">
                    <span className={l.isReversal ? "text-destructive" : undefined}>{l.description}</span>
                    <div className="text-xs text-muted-foreground">
                      <span className="sm:hidden">{formatDate(l.date)} · </span>
                      {[l.number, active.length > 1 ? l.accountName : null].filter(Boolean).join(" · ")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{l.receiptPaise ? <Money paise={l.receiptPaise} /> : ""}</TableCell>
                  <TableCell className="text-right">{l.paymentPaise ? <Money paise={l.paymentPaise} /> : ""}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <Money paise={l.balancePaise} colored={l.balancePaise < 0} />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-medium">
                <TableCell className="hidden sm:table-cell" />
                <TableCell>
                  Closing balance <Money paise={book.closingBalancePaise} className="sm:hidden" />
                </TableCell>
                <TableCell className="text-right">
                  <Money paise={s.totalReceiptsPaise} />
                </TableCell>
                <TableCell className="text-right">
                  <Money paise={s.totalPaymentsPaise} />
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <Money paise={book.closingBalancePaise} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
