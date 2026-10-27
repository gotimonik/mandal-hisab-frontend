import { api } from "@/lib/server/api";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { LoanDetail, type LoanDetailData } from "@/features/loans/loan-detail";

export default async function MyLoanPage({ params }: PageProps<"/org/[orgId]/my/loans/[loanId]">) {
  const { orgId, loanId } = await params;
  const data = await api<LoanDetailData>(`/orgs/${orgId}/me/loans/${loanId}`);
  return (
    <>
      <PageHeader eyebrow="My loan" title={`Loan ${data.loan.loanNumber}`} description={<StatusBadge status={data.loan.status} />} />
      <LoanDetail data={data} orgId={orgId} receiptBase={`/org/${orgId}/receipts`} />
    </>
  );
}
