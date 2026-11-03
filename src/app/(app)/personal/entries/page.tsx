import { ListOrdered } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/app/empty-state";
import { Money } from "@/components/app/money";
import { Pagination } from "@/components/app/pagination";
import { ExportCsvButton } from "@/components/app/export-csv-button";
import { getT } from "@/i18n/server";
import { formatDate, formatINR as formatINRPlain } from "@/lib/format";
import { AddEntryTiles, EntryRow } from "@/features/personal/entry-dialog";
import { categoryName, walletName, type EntryList, type PCategory, type PEntry, type PWallet } from "@/features/personal/types";

export const metadata = { title: "Personal Hisab · Entries" };

export default async function PersonalEntriesPage({ searchParams }: PageProps<"/personal/entries">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { from: str("from"), to: str("to"), type: str("type"), walletId: str("walletId"), categoryId: str("categoryId"), q: str("q") };
  // "From my Mandals" is a source, not a type
  const apiF = f.type === "mandal" ? { ...f, type: "", mandal: "1" } : f;
  const page = Math.max(1, Number(str("page")) || 1);
  const [list, w, c, { t }] = await Promise.all([
    api<EntryList>(`/me/personal/entries${qs({ ...apiF, page, pageSize: 50 })}`),
    api<{ wallets: PWallet[] }>("/me/personal/wallets"),
    api<{ categories: PCategory[] }>("/me/personal/categories"),
    getT(),
  ]);
  const book = { wallets: w.wallets, categories: c.categories };

  // group by day, newest first (the API already sorts them)
  const days: { date: string; items: PEntry[]; in: number; out: number }[] = [];
  for (const e of list.items) {
    let d = days.at(-1);
    if (!d || d.date !== e.date) days.push((d = { date: e.date, items: [], in: 0, out: 0 }));
    d.items.push(e);
    if (e.type === "income" || e.type === "in") d.in += e.amountPaise;
    if (e.type === "expense" || e.type === "out") d.out += e.amountPaise;
  }

  return (
    <>
      <PageHeader title={t("ph.list.title")} description={t("ph.list.desc")} actions={<ExportCsvButton href={`/api/export${qs({ path: "/me/personal/entries", ...apiF })}`}>{t("common.downloadCsv")}</ExportCsvButton>} />
      <AddEntryTiles book={book} compact className="hidden lg:grid" />
      <div className="lg:mt-4">
        <FilterBar resetHref="/personal/entries">
          <FilterField label={t("ph.list.from")}>
            <Input type="date" name="from" defaultValue={f.from} />
          </FilterField>
          <FilterField label={t("ph.list.to")}>
            <Input type="date" name="to" defaultValue={f.to} />
          </FilterField>
          <FilterField label={t("ph.list.type")}>
            <NativeSelect name="type" defaultValue={f.type}>
              <option value="">{t("ph.list.all")}</option>
              <option value="expense">{t("ph.entry.type.expense")}</option>
              <option value="income">{t("ph.entry.type.income")}</option>
              <option value="transfer">{t("ph.entry.type.transfer")}</option>
              <option value="mandal">{t("ph.mandal.filter")}</option>
            </NativeSelect>
          </FilterField>
          <FilterField label={t("ph.list.category")}>
            <NativeSelect name="categoryId" defaultValue={f.categoryId}>
              <option value="">{t("ph.list.all")}</option>
              {c.categories.map((k) => (
                <option key={k._id} value={k._id}>
                  {categoryName(t, k)}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
          {w.wallets.length > 1 && (
            <FilterField label={t("ph.list.wallet")}>
              <NativeSelect name="walletId" defaultValue={f.walletId}>
                <option value="">{t("ph.list.all")}</option>
                {w.wallets.map((x) => (
                  <option key={x._id} value={x._id}>
                    {walletName(t, x)}
                  </option>
                ))}
              </NativeSelect>
            </FilterField>
          )}
          <FilterField label={t("ph.list.search")} className="col-span-2 sm:w-56">
            <Input type="search" name="q" defaultValue={f.q} maxLength={100} />
          </FilterField>
        </FilterBar>
      </div>

      {(() => {
        const tt = list.totals;
        // Mandal money (in / out) moves the balance without being income or spending
        const moved = tt.inPaise > 0 || tt.outPaise > 0;
        const boxes = moved
          ? [
              { label: t("ph.moneyIn"), paise: tt.incomePaise + tt.inPaise, cls: "text-success" },
              { label: t("ph.list.moneyOut"), paise: tt.expensePaise + tt.outPaise, cls: "" },
              { label: t("ph.list.net"), paise: tt.incomePaise + tt.inPaise - tt.expensePaise - tt.outPaise, colored: true, cls: "" },
            ]
          : [
              { label: t("ph.moneyIn"), paise: tt.incomePaise, cls: "text-success" },
              { label: t("ph.spent"), paise: tt.expensePaise, cls: "" },
              { label: tt.netPaise < 0 ? t("ph.overspent") : t("ph.saved"), paise: tt.netPaise, colored: true, cls: "" },
            ];
        return (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {boxes.map((b) => (
              <div key={b.label} className="rounded-2xl bg-card px-3 py-2.5 shadow-card ring-1 ring-foreground/[0.06]">
                <p className="truncate text-xs text-muted-foreground">{b.label}</p>
                <Money paise={b.paise} colored={b.colored} className={`font-bold ${b.cls}`} />
              </div>
            ))}
          </div>
        );
      })()}

      {days.length === 0 ? (
        <EmptyState icon={<ListOrdered />} title={t("ph.list.none")} description={t("ph.list.noneDesc")} />
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((d) => (
            <section key={d.date} className="rounded-2xl bg-card px-2 py-2 shadow-card ring-1 ring-foreground/[0.06]">
              <header className="flex flex-wrap items-baseline justify-between gap-x-3 px-2 pt-1 pb-1.5">
                <h2 className="text-sm font-bold">{formatDate(d.date)}</h2>
                <p className="text-xs text-muted-foreground">{t("ph.list.dayTotal", { out: formatINRPlain(d.out), in: formatINRPlain(d.in) })}</p>
              </header>
              {d.items.map((e) => (
                <EntryRow key={e._id} entry={e} book={book} />
              ))}
            </section>
          ))}
        </div>
      )}
      <Pagination page={list.page} pageSize={list.pageSize} total={list.total} baseHref="/personal/entries" params={f} />
    </>
  );
}
