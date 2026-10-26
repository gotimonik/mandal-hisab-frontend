import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getT } from "@/i18n/server";

export async function Pagination({ page, pageSize, total, baseHref, params }: { page: number; pageSize: number; total: number; baseHref: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const { t } = await getT();
  if (pages <= 1) return <p className="mt-3 text-xs text-muted-foreground">{t("members.records", { n: total })}</p>;
  const href = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
    u.set("page", String(p));
    return `${baseHref}?${u.toString()}`;
  };
  return (
    <nav className="mt-3 flex items-center justify-between gap-2 text-sm" aria-label="Pagination">
      <span className="text-xs text-muted-foreground">
        {t("members.pageOf", { page, pages, n: total })}
      </span>
      <div className="flex gap-1">
        <Link aria-disabled={page <= 1} className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-50")} href={href(page - 1)}>
          <ChevronLeft /> {t("members.prev")}
        </Link>
        <Link aria-disabled={page >= pages} className={cn(buttonVariants({ variant: "outline", size: "sm" }), page >= pages && "pointer-events-none opacity-50")} href={href(page + 1)}>
          {t("members.next")} <ChevronRight />
        </Link>
      </div>
    </nav>
  );
}
