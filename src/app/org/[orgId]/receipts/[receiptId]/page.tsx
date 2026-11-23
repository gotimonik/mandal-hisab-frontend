import { api } from "@/lib/server/api";
import type { Receipt } from "@/lib/types";
import { Money } from "@/components/app/money";
import { PrintButton } from "@/components/app/print-button";
import { ShareDocument } from "@/components/app/share-document";
import { getMoney } from "@/lib/server/data";
import { formatDate, formatDateTime } from "@/lib/format";
import { getT } from "@/i18n/server";
import { methodLabel } from "@/i18n/labels";

export const metadata = { title: "Receipt" };

interface ReceiptView {
  receipt: Receipt;
  issuedByName: string | null;
  member: { name: string; membershipNumber: string } | null;
  organization: { name: string; address: string; contactPhone: string | null; contactEmail: string | null; registrationNumber: string | null; logoUrl: string | null };
}

export default async function ReceiptPage({ params }: PageProps<"/org/[orgId]/receipts/[receiptId]">) {
  const { orgId, receiptId } = await params;
  const { t } = await getT();
  const [{ receipt: r, organization: o, member, issuedByName }, money] = await Promise.all([api<ReceiptView>(`/orgs/${orgId}/receipts/${receiptId}`), getMoney(orgId)]);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex flex-wrap justify-end gap-2">
        <ShareDocument
          targetId="receipt-doc"
          fileName={t("doc.rFile", { number: r.receiptNumber })}
          title={t("doc.rFile", { number: r.receiptNumber })}
          text={`${member ? t("doc.rShareFrom", { org: o.name, number: r.receiptNumber, amount: money.fmt(r.amountPaise), name: member.name, date: formatDate(r.date) }) : t("doc.rShare", { org: o.name, number: r.receiptNumber, amount: money.fmt(r.amountPaise), date: formatDate(r.date) })}${r.status === "cancelled" ? t("doc.cancelledTag") : ""}`}
          path={`/org/${orgId}/receipts/${receiptId}`}
        />
        <PrintButton label={t("doc.printSave")} />
      </div>
      {/* Paper colours in light and dark mode: this is what's printed and shared as an image / PDF. */}
      <article id="receipt-doc" className="relative rounded-xl bg-white p-6 text-zinc-900 ring-1 ring-zinc-200 print:ring-0 sm:p-8 [&_*]:border-zinc-200">
        {r.status === "cancelled" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 !border-red-600/60 px-6 py-2 text-4xl font-bold tracking-widest text-red-600/60">{t("doc.CANCELLED")}</span>
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
            {[o.contactPhone, o.contactEmail, o.registrationNumber && t("doc.regNo", { no: o.registrationNumber })].filter(Boolean).join(" · ")}
          </p>
        </header>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{t("doc.receipt")}</p>
            <p className="font-mono text-lg font-semibold">{r.receiptNumber}</p>
          </div>
          <div className="text-right text-sm">
            <p>{t("doc.date", { date: formatDate(r.date) })}</p>
            <p className="text-zinc-500">{t("doc.issued", { at: formatDateTime(r.issuedAt) })}</p>
          </div>
        </div>
        <div className="mt-4 text-sm">
          <p>
            {t("doc.thanks")} <span className="font-semibold">{r.payerName}</span>
            {member && <span className="text-zinc-500">{t("doc.memberNo", { no: member.membershipNumber })}</span>}
          </p>
          <p className="text-zinc-500">
            {t("doc.byMethod", { method: methodLabel(t, r.method) })}
            {r.reference ? t("doc.ref", { ref: r.reference }) : ""}
          </p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-zinc-500">
              <th className="py-2 font-medium">{t("doc.particulars")}</th>
              <th className="py-2 text-right font-medium">{t("doc.amount")}</th>
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
              <td className="py-2 font-semibold">{t("doc.total")}</td>
              <td className="py-2 text-right text-base font-semibold">
                <Money paise={r.amountPaise} />
              </td>
            </tr>
          </tfoot>
        </table>
        <footer className="mt-8 flex items-end justify-between text-xs text-zinc-500">
          <span>{t("doc.system")}</span>
          <span className="text-right">
            {issuedByName && <span className="block text-zinc-900">{issuedByName}</span>}
            {t("doc.signatory")}
          </span>
        </footer>
      </article>
    </div>
  );
}
