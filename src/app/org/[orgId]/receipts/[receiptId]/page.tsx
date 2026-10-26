import { api } from "@/lib/server/api";
import type { Receipt } from "@/lib/types";
import { Money } from "@/components/app/money";
import { PrintButton } from "@/components/app/print-button";
import { formatDate, formatDateTime, METHOD_LABEL, label } from "@/lib/format";

export const metadata = { title: "Receipt" };

interface ReceiptView {
  receipt: Receipt;
  issuedByName: string | null;
  member: { name: string; membershipNumber: string } | null;
  organization: { name: string; address: string; contactPhone: string | null; contactEmail: string | null; registrationNumber: string | null; logoUrl: string | null };
}

export default async function ReceiptPage({ params }: PageProps<"/org/[orgId]/receipts/[receiptId]">) {
  const { orgId, receiptId } = await params;
  const { receipt: r, organization: o, member, issuedByName } = await api<ReceiptView>(`/orgs/${orgId}/receipts/${receiptId}`);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton label="Print / Save as PDF" />
      </div>
      <article className="relative rounded-xl bg-card p-6 ring-1 ring-foreground/10 print:ring-0 sm:p-8">
        {r.status === "cancelled" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 border-destructive/60 px-6 py-2 text-4xl font-bold tracking-widest text-destructive/60">CANCELLED</span>
          </div>
        )}
        <header className="flex flex-col gap-1 border-b pb-4 text-center">
          <h1 className="text-xl font-semibold">{o.name}</h1>
          {o.address && <p className="text-xs text-muted-foreground">{o.address}</p>}
          <p className="text-xs text-muted-foreground">
            {[o.contactPhone, o.contactEmail, o.registrationNumber && `Reg. No. ${o.registrationNumber}`].filter(Boolean).join(" · ")}
          </p>
        </header>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Receipt</p>
            <p className="font-mono text-lg font-semibold">{r.receiptNumber}</p>
          </div>
          <div className="text-right text-sm">
            <p>Date: {formatDate(r.date)}</p>
            <p className="text-muted-foreground">Issued {formatDateTime(r.issuedAt)}</p>
          </div>
        </div>
        <div className="mt-4 text-sm">
          <p>
            Received with thanks from <span className="font-semibold">{r.payerName}</span>
            {member && <span className="text-muted-foreground"> (Member no. {member.membershipNumber})</span>}
          </p>
          <p className="text-muted-foreground">
            by {label(METHOD_LABEL, r.method)}
            {r.reference ? ` · Ref ${r.reference}` : ""}
          </p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 font-medium">Particulars</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right">
                  <Money paise={l.amountPaise} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2">
              <td className="py-2 font-semibold">Total</td>
              <td className="py-2 text-right text-base font-semibold">
                <Money paise={r.amountPaise} />
              </td>
            </tr>
          </tfoot>
        </table>
        <footer className="mt-8 flex items-end justify-between text-xs text-muted-foreground">
          <span>System-generated receipt · MandalHisab</span>
          <span className="text-right">
            {issuedByName && <span className="block text-foreground">{issuedByName}</span>}
            Authorised signatory
          </span>
        </footer>
      </article>
    </div>
  );
}
