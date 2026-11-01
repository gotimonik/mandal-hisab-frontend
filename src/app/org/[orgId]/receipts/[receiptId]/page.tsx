import { api } from "@/lib/server/api";
import type { Receipt } from "@/lib/types";
import { Money } from "@/components/app/money";
import { PrintButton } from "@/components/app/print-button";
import { ShareDocument } from "@/components/app/share-document";
import { getMoney } from "@/lib/server/data";
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
  const [{ receipt: r, organization: o, member, issuedByName }, money] = await Promise.all([api<ReceiptView>(`/orgs/${orgId}/receipts/${receiptId}`), getMoney(orgId)]);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex flex-wrap justify-end gap-2">
        <ShareDocument
          targetId="receipt-doc"
          fileName={`Receipt ${r.receiptNumber}`}
          title={`Receipt ${r.receiptNumber}`}
          text={`${o.name} — receipt ${r.receiptNumber}: ${money.fmt(r.amountPaise)}${member ? ` from ${member.name}` : ""} on ${formatDate(r.date)}${r.status === "cancelled" ? " (cancelled)" : ""}.`}
          path={`/org/${orgId}/receipts/${receiptId}`}
        />
        <PrintButton label="Print / Save as PDF" />
      </div>
      {/* Paper colours in light and dark mode: this is what's printed and shared as an image / PDF. */}
      <article id="receipt-doc" className="relative rounded-xl bg-white p-6 text-zinc-900 ring-1 ring-zinc-200 print:ring-0 sm:p-8 [&_*]:border-zinc-200">
        {r.status === "cancelled" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 !border-red-600/60 px-6 py-2 text-4xl font-bold tracking-widest text-red-600/60">CANCELLED</span>
          </div>
        )}
        <header className="flex flex-col items-center gap-1 border-b pb-4 text-center">
          {o.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- printed as-is; a Vercel Blob image (≤ 1 MB)
            <img src={o.logoUrl} alt="" className="mb-1 h-16 w-auto max-w-40 object-contain" />
          )}
          <h1 className="text-xl font-semibold">{o.name}</h1>
          {o.address && <p className="text-xs text-zinc-500">{o.address}</p>}
          <p className="text-xs text-zinc-500">
            {[o.contactPhone, o.contactEmail, o.registrationNumber && `Reg. No. ${o.registrationNumber}`].filter(Boolean).join(" · ")}
          </p>
        </header>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Receipt</p>
            <p className="font-mono text-lg font-semibold">{r.receiptNumber}</p>
          </div>
          <div className="text-right text-sm">
            <p>Date: {formatDate(r.date)}</p>
            <p className="text-zinc-500">Issued {formatDateTime(r.issuedAt)}</p>
          </div>
        </div>
        <div className="mt-4 text-sm">
          <p>
            Received with thanks from <span className="font-semibold">{r.payerName}</span>
            {member && <span className="text-zinc-500"> (Member no. {member.membershipNumber})</span>}
          </p>
          <p className="text-zinc-500">
            by {label(METHOD_LABEL, r.method)}
            {r.reference ? ` · Ref ${r.reference}` : ""}
          </p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-zinc-500">
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
        <footer className="mt-8 flex items-end justify-between text-xs text-zinc-500">
          <span>System-generated receipt · MandalHisab</span>
          <span className="text-right">
            {issuedByName && <span className="block text-zinc-900">{issuedByName}</span>}
            Authorised signatory
          </span>
        </footer>
      </article>
    </div>
  );
}
