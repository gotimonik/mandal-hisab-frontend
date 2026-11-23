import Link from "next/link";
import { CheckCircle2, HandCoins, History, Lock, Users } from "lucide-react";
import { api } from "@/lib/server/api";
import { can, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { SummaryBand } from "@/components/app/summary-band";
import { Money } from "@/components/app/money";
import { FormNote } from "@/components/app/form-bits";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { getT } from "@/i18n/server";
import { monthName } from "@/i18n/core";
import { OpeningImportForm, type ImportStatus } from "@/features/opening-import/opening-import-form";
import { ActionButton } from "@/components/app/action-button";

export const metadata = { title: "Bring in an existing Mandal" };

export default async function OpeningImportPage({ params }: PageProps<"/org/[orgId]/settings/import">) {
  const { orgId } = await params;
  const { t, lang } = await getT();
  const org = await getOrg(orgId);
  if (!can(org, "org.settings.manage")) {
    return (
      <div className="max-w-3xl">
        <PageHeader title={t("close.imp.title")} />
        <FormNote tone="warn">{t("close.imp.onlyAdmin")}</FormNote>
      </div>
    );
  }
  const done = org.settings.openingImport;
  if (done) {
    return (
      <div className="max-w-3xl">
        <PageHeader title={t("close.imp.doneTitle")} description={t("close.imp.doneDesc", { cutover: formatDate(done.cutoverDate), at: formatDate(done.at) })} />
        <SummaryBand
          tone="green"
          icon={<CheckCircle2 />}
          label={t("close.imp.savings")}
          value={<Money paise={done.savingsPaise} />}
          sub={t("close.imp.sub", { n: done.members, month: monthName(lang, done.haptaStartMonth) })}
          stats={[
            { label: t("close.imp.cash"), value: <Money paise={done.cashPaise} /> },
            { label: t("close.upadOut"), value: <Money paise={done.upadPaise} /> },
            { label: t("close.mandalOwn"), value: <Money paise={done.mandalOwnPaise} /> },
          ]}
        />
        {done.note && <p className="mb-4 text-sm text-muted-foreground">{t("close.imp.note", { note: done.note })}</p>}
        {done.interestDuePaise > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-500/8 p-4 text-sm ring-1 ring-amber-500/20">
            <p className="min-w-0 flex-1">
              <b>
                {t("close.imp.interest")} <Money paise={done.interestDuePaise} />
              </b>
              <span className="block text-xs text-muted-foreground">
                {done.interestInSavings
                  ? t("close.imp.inSavings")
                  : t("close.imp.shared")}
              </span>
            </p>
            {org.status === "active" && (
              <ActionButton
                path={`/orgs/${orgId}/opening-import/interest-in-savings`}
                body={{ inSavings: !done.interestInSavings }}
                variant={done.interestInSavings ? "outline" : "default"}
                successMessage={done.interestInSavings ? t("close.imp.okShared") : t("close.imp.okCash")}
                confirm={{
                  title: done.interestInSavings ? t("close.imp.qShare") : t("close.imp.qIn"),
                  description: done.interestInSavings
                    ? t("close.imp.dShare")
                    : t("close.imp.dIn"),
                  confirmLabel: done.interestInSavings ? t("close.imp.cShare") : t("close.imp.cIn"),
                }}
              >
                {done.interestInSavings ? t("close.imp.undo") : t("close.imp.already")}
              </ActionButton>
            )}
          </div>
        )}
        <FormNote>
          {t("close.imp.keep", { date: formatDate(done.cutoverDate) })}
        </FormNote>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/org/${orgId}/members`} className={buttonVariants({ variant: "outline" })}>
            <Users /> {t("close.imp.members")}
          </Link>
          <Link href={`/org/${orgId}/fund-loans`} className={buttonVariants({ variant: "outline" })}>
            <HandCoins /> {t("close.imp.upad")}
          </Link>
          <Link href={`/org/${orgId}/monthly`} className={buttonVariants({ variant: "default" })}>
            {t("close.imp.collect")}
          </Link>
        </div>
      </div>
    );
  }

  const status = await api<ImportStatus>(`/orgs/${orgId}/opening-import`);
  return (
    <div className="max-w-3xl">
      <PageHeader title={t("close.imp.title")} description={t("close.imp.desc")} />
      {!status.canImport ? (
        <div className="flex flex-col gap-2">
          {status.blockers.map((b, i) => (
            <FormNote key={i} tone="warn">
              {b}
            </FormNote>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl bg-card p-4 text-sm shadow-card ring-1 ring-foreground/[0.06]">
            <p className="mb-2 flex items-center gap-2 font-semibold">
              <History className="size-4" /> {t("close.imp.how")}
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>{t("close.imp.h1")}</li>
              <li>{t("close.imp.h2")}</li>
              <li>{t("close.imp.h3")}</li>
              <li>{t("close.imp.h4")}</li>
            </ol>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> {t("close.imp.saved")}
            </p>
          </div>
          <OpeningImportForm orgId={orgId} status={status} />
        </>
      )}
    </div>
  );
}
