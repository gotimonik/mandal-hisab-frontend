import { getActiveMembers, getOrg, can } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { LoanForm } from "@/features/loans/loan-form";

import { getT } from "@/i18n/server";

export const metadata = { title: "New loan" };

export default async function NewLoanPage({ params }: PageProps<"/org/[orgId]/loans/new">) {
  const { orgId } = await params;
  const { t } = await getT();
  const [org, members] = await Promise.all([getOrg(orgId), getActiveMembers(orgId)]);
  return (
    <>
      <PageHeader title={t("loan.newTitle")} description={t("loan.newDesc")} />
      <LoanForm orgId={orgId} members={members.map((m) => ({ _id: m._id, name: m.name, membershipNumber: m.membershipNumber }))} canSetRate={can(org, "interest.manage")} />
    </>
  );
}
