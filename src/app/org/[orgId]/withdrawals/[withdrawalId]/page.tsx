import { api } from "@/lib/server/api";
import type { Withdrawal } from "@/lib/types";
import { Money } from "@/components/app/money";
import { PrintButton } from "@/components/app/print-button";
import { ShareDocument } from "@/components/app/share-document";
import { getMoney } from "@/lib/server/data";
import { formatDate, formatDateTime } from "@/lib/format";
import { getT } from "@/i18n/server";

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
  const { t } = await getT();
  const [{ withdrawal: w, member, accountName, recordedByName, organization: o }, money] = await Promise.all([api<VoucherView>(`/orgs/${orgId}/withdrawals/${withdrawalId}`), getMoney(orgId)]);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex flex-wrap justify-end gap-2">
        <ShareDocument
          targetId="voucher-doc"
          fileName={t("doc.wFile", { number: w.number })}
          title={t("doc.wVoucherN", { number: w.number })}
          text={`${member ? t("doc.wShareTo", { org: o.name, number: w.number, amount: money.fmt(w.amountPaise), name: member.name, date: formatDate(w.date) }) : t("doc.wShare", { org: o.name, number: w.number, amount: money.fmt(w.amountPaise), date: formatDate(w.date) })}${w.status === "reversed" ? t("doc.reversedTag") : ""}`}
          path={`/org/${orgId}/withdrawals/${withdrawalId}`}
        />
        <PrintButton label={t("doc.printSave")} />
      </div>
      {/* Paper colours in light and dark mode: this is what's printed and shared as an image / PDF. */}
      <article id="voucher-doc" className="relative rounded-xl bg-white p-6 text-zinc-900 ring-1 ring-zinc-200 print:ring-0 sm:p-8 [&_*]:border-zinc-200">
        {w.status === "reversed" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 !border-red-600/60 px-6 py-2 text-4xl font-bold tracking-widest text-red-600/60">{t("doc.REVERSED")}</span>
          </div>
        )}
        <header className="flex flex-col gap-1 border-b pb-4 text-center">
          <h1 className="text-xl font-semibold">{o.name}</h1>
          {o.address && <p className="text-xs text-zinc-500">{o.address}</p>}
          {o.contactPhone && <p className="text-xs text-zinc-500">{o.contactPhone}</p>}
        </header>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{t("doc.wVoucher")}</p>
            <p className="font-mono text-lg font-semibold">{w.number}</p>
          </div>
          <div className="text-right text-sm">
            <p>{t("doc.date", { date: formatDate(w.date) })}</p>
            <p className="text-zinc-500">{t("doc.recorded", { at: formatDateTime(w.createdAt) })}</p>
          </div>
        </div>
        <p className="mt-4 text-sm">
          {t("doc.paidCashTo")} <span className="font-semibold">{member?.name ?? "—"}</span>
          {member && <span className="text-zinc-500">{t("doc.memberNo", { no: member.membershipNumber })}</span>}
          {accountName && <span className="text-zinc-500">{t("doc.fromAcc", { name: accountName })}</span>}
        </p>
        {w.note && <p className="text-sm text-zinc-500">{t("doc.note", { note: w.note })}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-y-2 rounded-lg bg-zinc-100 p-4 text-sm">
          <dt>{t("doc.balBefore")}</dt>
          <dd className="text-right">
            <Money paise={w.balanceBeforePaise} />
          </dd>
          <dt className="font-semibold">{t("doc.amountPaid")}</dt>
          <dd className="text-right text-base font-semibold">
            <Money paise={w.amountPaise} />
          </dd>
          <dt>{t("doc.balAfter")}</dt>
          <dd className="text-right">
            <Money paise={w.balanceAfterPaise} colored />
          </dd>
        </dl>
        {w.exceptionReason && <p className="mt-3 text-sm text-amber-700">{t("doc.aboveBal", { reason: w.exceptionReason })}</p>}
        {w.status === "reversed" && w.reversalReason && <p className="mt-3 text-sm text-red-600">{t("doc.reversed", { reason: w.reversalReason })}</p>}
        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs text-zinc-500">
          <div className="border-t pt-2">{t("doc.paidBy")}{recordedByName ? ` — ${recordedByName}` : ""}</div>
          <div className="border-t pt-2">{t("doc.receivedBy")}</div>
        </div>
      </article>
    </div>
  );
}
