"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMoney } from "@/components/app/currency";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyChart({ data }: { data: { month: string; incomePaise: number; expensePaise: number }[] }) {
  const money = useMoney();
  const rows = data.map((d) => ({ name: `${MONTHS[Number(d.month.slice(5, 7)) - 1]} ${d.month.slice(2, 4)}`, Income: d.incomePaise, Expenses: d.expensePaise }));
  return (
    <div className="h-64 w-full" role="img" aria-label="Monthly income and expenses for the last 12 months">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickFormatter={(v: number) => money.compact(v)} tickLine={false} axisLine={false} fontSize={11} width={64} />
          <Tooltip formatter={(v) => money.fmt(Number(v))} cursor={{ fillOpacity: 0.08 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
