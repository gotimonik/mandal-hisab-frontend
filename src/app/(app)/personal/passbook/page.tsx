import { api, qs } from "@/lib/server/api";
import { requestToday } from "@/lib/server/today";
import { getT } from "@/i18n/server";
import type { T } from "@/i18n/core";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { ShareDocument } from "@/components/app/share-document";
import { PrintButton } from "@/components/app/print-button";
import { formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PassbookFilters } from "@/features/personal/passbook-filters";
import { passbookPresets } from "@/features/personal/passbook-presets";
import { categoryName, mandalLabel, walletName, type PCategory, type PEntry, type PWallet } from "@/features/personal/types";

export const metadata = { title: "Personal Hisab · Passbook" };

interface Passbook {
  book: { name: string; isMain: boolean };
  person: string;
  from: string;
  to: string;
  wallet: PWallet | null;
  openingPaise: number;
  closingPaise: number;
  totalInPaise: number;
  totalOutPaise: number;
  rows: (PEntry & { inPaise: number; outPaise: number; balancePaise: number })[];
  spending: { category: PCategory | null; totalPaise: number }[];
  wallets: PWallet[];
}

const rowTitle = (t: T, e: PEntry) => (e.mandal ? mandalLabel(t, e.mandal) : e.type === "transfer" ? t("ph.entry.transferLine", { from: walletName(t, e.wallet), to: walletName(t, e.toWallet) }) : categoryName(t, e.category));

/** "01 Oct 2026" */
const short = (d: string) => formatDate(d);

/** The wide (table) layout's columns: date · details · in · out · balance. */
const COLS = "grid-cols-[5.5rem_1fr_6.5rem_6.5rem_7.5rem] gap-x-3 px-1";

/**
 * One line of the passbook. Narrow: what it was and the date on the left; the amount and the
 * balance after it on the right. Wide: a table row. Each is one `data-row`, so a PDF page is only
 * ever cut between lines.
 */
function Line({ first, title, sub, inPaise = 0, outPaise = 0, balance, italic = false, total = false }: { first: string; title: string; sub?: string; inPaise?: number; outPaise?: number; balance: string; italic?: boolean; total?: boolean }) {
  const amt = (v: number) => formatINR(v, { symbol: false });
  const box = cn("border-b py-1.5", italic && "italic", total && "border-b-2 border-zinc-300 bg-zinc-50 font-bold");
  return (
    <div data-row className={box}>
      {/* narrow */}
      <div className="flex items-start justify-between gap-3 px-1 @xl:hidden">
        <div className="min-w-0">
          <p className={cn("break-words", !total && "font-medium")}>{title}</p>
          <p className="text-[11px] break-words text-zinc-500 not-italic">{[first, sub].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="shrink-0 text-right tabular-nums">
          {total ? (
            <p className="text-[11px] font-semibold">
              <span className="text-emerald-700">+{amt(inPaise)}</span> <span className="text-rose-700">−{amt(outPaise)}</span>
            </p>
          ) : inPaise ? (
            <p className="font-semibold text-emerald-700">+{amt(inPaise)}</p>
          ) : outPaise ? (
            <p className="font-semibold text-rose-700">−{amt(outPaise)}</p>
          ) : null}
          <p className={cn("text-[11px] text-zinc-500", (italic || total) && "text-sm font-bold text-zinc-900 not-italic")}>{balance}</p>
        </div>
      </div>
      {/* wide */}
      <div className={cn(COLS, "hidden @xl:grid")}>
        <span className="text-zinc-600">{first}</span>
        <span className="min-w-0">
          <span className={cn("block break-words", !total && !italic && "font-medium")}>{title}</span>
          {sub && <span className="block text-xs break-words text-zinc-500">{sub}</span>}
        </span>
        <span className="text-right text-emerald-700 tabular-nums">{inPaise ? amt(inPaise) : ""}</span>
        <span className="text-right text-rose-700 tabular-nums">{outPaise ? amt(outPaise) : ""}</span>
        <span className={cn("text-right tabular-nums", !italic && "font-semibold")}>{balance}</span>
      </div>
    </div>
  );
}

/**
 * The passbook of the current book: every entry in a period with the balance after it. It's the
 * person's own record — shared only when they choose, as a PDF / picture, or printed.
 */
export default async function PassbookPage({ searchParams }: PageProps<"/personal/passbook">) {
  const sp = await searchParams;
  const today = await requestToday();
  const str = (k: string) => (typeof sp[k] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp[k] as string) ? (sp[k] as string) : "");
  const month = passbookPresets(today)[0];
  const from = str("from") || month.from;
  const to = str("to") || month.to;
  const walletId = typeof sp.wallet === "string" && /^[a-f0-9]{24}$/.test(sp.wallet) ? sp.wallet : "";
  const [p, { t }] = await Promise.all([api<Passbook>(`/me/personal/passbook${qs({ from, to, walletId })}`), getT()]);
  const bookName = p.book.isMain && p.book.name === "Personal" ? t("ph.books.defaultMain") : p.book.name;
  const scope = p.wallet ? walletName(t, p.wallet) : t("ph.passbook.allWallets");
  const period = `${short(p.from)} – ${short(p.to)}`;
  // rows inside one year don't repeat it: "02 Oct"
  const sameYear = p.from.slice(0, 4) === p.to.slice(0, 4);
  const dateShort = (d: string) => (sameYear ? short(d).replace(/\s*\d{4}$/, "") : short(d));
  const title = `${t("ph.passbook.title")} · ${bookName}`;

  return (
    <>
      <PageHeader
        title={t("ph.passbook.title")}
        description={t("ph.passbook.desc")}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <ShareDocument
              targetId="passbook-doc"
              paged
              allowLink={false}
              fileName={`Passbook ${bookName} ${p.from} to ${p.to}`}
              title={title}
              text={t("ph.passbook.shareText", { book: bookName, period, amount: formatINR(p.closingPaise) })}
              path="/personal/passbook"
            />
            <PrintButton label={t("ph.passbook.print")} />
          </div>
        }
      />
      <PassbookFilters today={today} from={p.from} to={p.to} walletId={walletId} wallets={p.wallets.filter((w) => !w.isArchived || w._id === walletId)} />

      {/*
        Paper colours in light and dark mode: this is what's printed and shared. It lays itself out by
        its own width (@container): two lines per entry on a phone, a table when wide — and the shared
        PDF / picture is always drawn wide, like an A4 page.
      */}
      <article id="passbook-doc" className="@container rounded-2xl bg-white p-4 text-zinc-900 ring-1 ring-zinc-200 print:rounded-none print:p-0 print:ring-0 sm:p-6 [&_*]:border-zinc-200">
        <header data-row className="flex items-start justify-between gap-3 border-b pb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">{t("ph.passbook.title")}</p>
            <h2 className="text-lg leading-tight font-extrabold @xl:text-xl">{bookName}</h2>
            <p className="text-xs text-zinc-600">{p.person}</p>
          </div>
          <div className="shrink-0 text-right text-xs text-zinc-600">
            <p className="font-semibold text-zinc-900">{period}</p>
            <p>{scope}</p>
          </div>
        </header>

        <div data-row className="grid grid-cols-2 gap-2 py-3 @xl:grid-cols-4">
          {[
            { label: t("ph.passbook.opening"), v: p.openingPaise, cls: "" },
            { label: t("ph.passbook.moneyIn"), v: p.totalInPaise, cls: "text-emerald-700" },
            { label: t("ph.passbook.moneyOut"), v: p.totalOutPaise, cls: "text-rose-700" },
            { label: t("ph.passbook.closing"), v: p.closingPaise, cls: "font-extrabold" },
          ].map((b) => (
            <div key={b.label} className="rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200">
              <p className="text-[11px] text-zinc-600">{b.label}</p>
              <p className={cn("text-sm font-bold tabular-nums @xl:text-base", b.cls)}>
                <Money paise={b.v} />
              </p>
            </div>
          ))}
        </div>

        <div className="text-sm">
          {/* table header (wide only) */}
          <div data-row className={cn(COLS, "hidden border-y bg-zinc-50 py-1.5 text-xs font-semibold text-zinc-600 @xl:grid")}>
            <span>{t("ph.passbook.date")}</span>
            <span>{t("ph.passbook.details")}</span>
            <span className="text-right">{t("ph.passbook.in")}</span>
            <span className="text-right">{t("ph.passbook.out")}</span>
            <span className="text-right">{t("ph.passbook.balance")}</span>
          </div>

          <Line first={dateShort(p.from)} title={t("ph.passbook.opening")} balance={formatINR(p.openingPaise)} italic />

          {p.rows.length === 0 && (
            <p data-row className="border-b px-1 py-4 text-center text-zinc-500">
              {t("ph.passbook.none")}
            </p>
          )}
          {p.rows.map((r) => (
            <Line
              key={r._id}
              first={dateShort(r.date)}
              title={rowTitle(t, r)}
              sub={[r.note, !p.wallet && r.type !== "transfer" && r.wallet ? walletName(t, r.wallet) : null].filter(Boolean).join(" · ")}
              inPaise={r.inPaise}
              outPaise={r.outPaise}
              balance={formatINR(r.balancePaise, { symbol: false })}
            />
          ))}

          <Line first={dateShort(p.to)} title={t("ph.passbook.closing")} inPaise={p.totalInPaise} outPaise={p.totalOutPaise} balance={formatINR(p.closingPaise)} total />
        </div>

        {!p.wallet && (
          <p data-row className="mt-2 text-[11px] text-zinc-500 @xl:text-xs">
            {t("ph.passbook.allWalletsNote")}
          </p>
        )}

        {p.spending.length > 0 && (
          <section className="mt-4">
            <h3 data-row className="mb-1.5 text-xs font-bold tracking-wider text-zinc-600 uppercase">
              {t("ph.passbook.spendingBy")}
            </h3>
            {p.spending.map((s, i) => (
              <div key={s.category?._id ?? `none-${i}`} data-row className="flex items-center justify-between gap-3 border-b py-1.5 text-sm">
                <span>{categoryName(t, s.category)}</span>
                <span className="font-semibold tabular-nums">{formatINR(s.totalPaise)}</span>
              </div>
            ))}
          </section>
        )}

        <p data-row className="mt-4 text-center text-[10px] text-zinc-400">
          {t("ph.passbook.made", { date: short(today) })}
        </p>
      </article>
    </>
  );
}
