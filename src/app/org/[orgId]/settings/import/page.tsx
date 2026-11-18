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
import { monthLabelYM } from "@/lib/months";
import { OpeningImportForm, type ImportStatus } from "@/features/opening-import/opening-import-form";

export const metadata = { title: "Bring in an existing Mandal" };

export default async function OpeningImportPage({ params }: PageProps<"/org/[orgId]/settings/import">) {
  const { orgId } = await params;
  const org = await getOrg(orgId);
  if (!can(org, "org.settings.manage")) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Bring in an existing Mandal" />
        <FormNote tone="warn">Only the Mandal&apos;s admin can bring in the old hisab.</FormNote>
      </div>
    );
  }
  const done = org.settings.openingImport;
  if (done) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Old hisab brought in" description={`Paper books closed on ${formatDate(done.cutoverDate)} · brought in on ${formatDate(done.at)}`} />
        <SummaryBand
          tone="green"
          icon={<CheckCircle2 />}
          label="Members' savings brought in"
          value={<Money paise={done.savingsPaise} />}
          sub={`${done.members} members · hapta in the app from ${monthLabelYM(done.haptaStartMonth)}`}
          stats={[
            { label: "Cash in hand", value: <Money paise={done.cashPaise} /> },
            { label: "Upad still out", value: <Money paise={done.upadPaise} /> },
            { label: "Mandal's own money", value: <Money paise={done.mandalOwnPaise} /> },
          ]}
        />
        {done.note && <p className="mb-4 text-sm text-muted-foreground">Note: {done.note}</p>}
        <FormNote>
          Keep the old registers (or photos of them) safe — they are the record of everything before {formatDate(done.cutoverDate)}. A wrong figure for one member is fixed from their page with an adjustment; a wrong upad is cancelled on the upad screen and given again.
        </FormNote>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/org/${orgId}/members`} className={buttonVariants({ variant: "outline" })}>
            <Users /> Members
          </Link>
          <Link href={`/org/${orgId}/fund-loans`} className={buttonVariants({ variant: "outline" })}>
            <HandCoins /> Upad
          </Link>
          <Link href={`/org/${orgId}/monthly`} className={buttonVariants({ variant: "default" })}>
            Collect this month&apos;s hapta
          </Link>
        </div>
      </div>
    );
  }

  const status = await api<ImportStatus>(`/orgs/${orgId}/opening-import`);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Bring in an existing Mandal" description="For a Mandal that has been running on paper. Bring in where things stand today; old months are not typed in again." />
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
              <History className="size-4" /> How it works
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Close the registers on one date and write each member&apos;s savings, shares and any upad still owed (with unpaid interest).</li>
              <li>Get the members to agree the sheet at a meeting. The tally below must make sense.</li>
              <li>Enter it here (or paste it from Excel), check, and bring it in — once.</li>
              <li>From the next month on, collect hapta, upad and interest in the app.</li>
            </ol>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> Your typing is saved on this device as you go, so you can finish it later.
            </p>
          </div>
          <OpeningImportForm orgId={orgId} status={status} />
        </>
      )}
    </div>
  );
}
