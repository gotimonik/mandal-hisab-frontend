import { api } from "@/lib/server/api";
import type { Withdrawal } from "@/lib/types";
import { Money } from "@/components/app/money";
import { PrintButton } from "@/components/app/print-button";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata = { title: "Withdrawal voucher" };

interface VoucherView {
  withdrawal: Withdrawal;
  member: { name: string; membershipNumber: string; phone?: string } | null;
  accountName: string | null;
  recordedByName: string | null;
  organization: { name: string; address: string; contactPhone: string | null };
}

export default async function WithdrawalVoucherPage({ params }: PageProps<"/org/[orgId]/withdrawals/[withdrawalId]">) {
  const { orgId, withdrawalId } = await params;
  const { withdrawal: w, member, accountName, recordedByName, organization: o } = await api<VoucherView>(`/orgs/${orgId}/withdrawals/${withdrawalId}`);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton label="Print / Save as PDF" />
      </div>
      <article className="relative rounded-xl bg-card p-6 ring-1 ring-foreground/10 print:ring-0 sm:p-8">
        {w.status === "reversed" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 border-destructive/60 px-6 py-2 text-4xl font-bold tracking-widest text-destructive/60">REVERSED</span>
          </div>
        )}
        <header className="flex flex-col gap-1 border-b pb-4 text-center">
          <h1 className="text-xl font-semibold">{o.name}</h1>
          {o.address && <p className="text-xs text-muted-foreground">{o.address}</p>}
          {o.contactPhone && <p className="text-xs text-muted-foreground">{o.contactPhone}</p>}
        </header>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Withdrawal voucher</p>
            <p className="font-mono text-lg font-semibold">{w.number}</p>
          </div>
          <div className="text-right text-sm">
            <p>Date: {formatDate(w.date)}</p>
            <p className="text-muted-foreground">Recorded {formatDateTime(w.createdAt)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm">
          Paid in cash to <span className="font-semibold">{member?.name ?? "—"}</span>
          {member && <span className="text-muted-foreground"> (Member no. {member.membershipNumber})</span>}
          {accountName && <span className="text-muted-foreground"> from {accountName}</span>}
        </p>
        {w.note && <p className="text-sm text-muted-foreground">Note: {w.note}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-y-2 rounded-lg bg-muted/50 p-4 text-sm">
          <dt>Balance before</dt>
          <dd className="text-right">
            <Money paise={w.balanceBeforePaise} />
          </dd>
          <dt className="font-semibold">Amount paid</dt>
          <dd className="text-right text-base font-semibold">
            <Money paise={w.amountPaise} />
          </dd>
          <dt>Balance after</dt>
          <dd className="text-right">
            <Money paise={w.balanceAfterPaise} colored />
          </dd>
        </dl>
        {w.exceptionReason && <p className="mt-3 text-sm text-warning-ink">Approved above balance: {w.exceptionReason}</p>}
        {w.status === "reversed" && w.reversalReason && <p className="mt-3 text-sm text-destructive">Reversed: {w.reversalReason}</p>}
        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs text-muted-foreground">
          <div className="border-t pt-2">Paid by{recordedByName ? ` — ${recordedByName}` : ""}</div>
          <div className="border-t pt-2">Received by (member&apos;s signature)</div>
        </div>
      </article>
    </div>
  );
}
