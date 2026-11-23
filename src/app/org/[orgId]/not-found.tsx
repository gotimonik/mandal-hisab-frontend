import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="flex flex-col items-start gap-3 py-10">
      <h2 className="text-lg font-semibold">{t("misc.nf.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("misc.nf.desc")}</p>
      <Link href="/onboarding" className={buttonVariants({ variant: "outline" })}>
        {t("misc.nf.back")}
      </Link>
    </div>
  );
}
