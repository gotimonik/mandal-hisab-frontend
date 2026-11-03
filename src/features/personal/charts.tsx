"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMoney } from "@/components/app/currency";
import { useLang, useT } from "@/i18n/client";
import { monthName } from "@/i18n/core";

/** Spending on each day of the month. */
export function DailyChart({ days }: { days: { date: string; expensePaise: number }[] }) {
  const money = useMoney();
  const t = useT();
  const rows = days.map((d) => ({ day: Number(d.date.slice(8, 10)), value: d.expensePaise }));
  return (
    <div className="h-48 w-full" role="img" aria-label={t("ph.dailyAria")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" minTickGap={8} />
          <YAxis tickFormatter={(v: number) => money.compact(v)} tickLine={false} axisLine={false} fontSize={11} width={56} />
          <Tooltip formatter={(v) => [money.fmt(Number(v)), t("ph.spent")]} labelFormatter={(d) => String(d)} cursor={{ fillOpacity: 0.08 }} />
          <Bar dataKey="value" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Money in and spent, month by month. */
/** `only` shows just one of the two bars (a category is only spending or only income). */
export function MonthsChart({ months, only }: { months: { month: string; incomePaise: number; expensePaise: number }[]; only?: "income" | "expense" }) {
  const money = useMoney();
  const t = useT();
  const lang = useLang();
  const inLabel = t("ph.report.in");
  const outLabel = t("ph.report.out");
  const rows = months.map((m) => ({ name: monthName(lang, m.month, "short"), [inLabel]: m.incomePaise, [outLabel]: m.expensePaise }));
  return (
    <div className="h-60 w-full" role="img" aria-label={t("ph.report.chartAria")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} maxBarSize={48}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickFormatter={(v: number) => money.compact(v)} tickLine={false} axisLine={false} fontSize={11} width={60} />
          <Tooltip formatter={(v) => money.fmt(Number(v))} cursor={{ fillOpacity: 0.08 }} />
          {!only && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
          {only !== "expense" && <Bar dataKey={inLabel} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />}
          {only !== "income" && <Bar dataKey={outLabel} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
