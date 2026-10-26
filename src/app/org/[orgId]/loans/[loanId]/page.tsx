import { api } from "@/lib/server/api";
import { getAccounts, getOrg, can } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { ActionButton } from "@/components/app/action-button";
import { formatINR } from "@/lib/format";
import { LoanDetail, type LoanDetailData } from "@/features/loans/loan-detail";
import { ApproveLoanDialog, DisburseLoanDialog, RateChangeDialog, RepayLoanDialog } from "@/features/loans/loan-dialogs";

export default async function LoanPage({ params }: PageProps<"/org/[orgId]/loans/[loanId]">) {
  const { orgId, loanId } = await params;
  const [org, data, accounts] = await Promise.all([getOrg(orgId), api<LoanDetailData>(`/orgs/${orgId}/loans/${loanId}`), getAccounts(orgId)]);
  const l = data.loan;
  const active = accounts.filter((a) => a.isActive).map((a) => ({ _id: a._id, name: a.name }));
  const writable = org.status === "active";
  const canApprove = can(org, "loans.approve") && writable;
  return (
    <>
      <PageHeader
        title={`Loan ${l.loanNumber}`}
        description={
          <>
            <StatusBadge status={l.status} /> <span className="ml-1">{data.member?.name}</span>
          </>
        }
        actions={
          <>
            {l.status === "applied" && canApprove && <ApproveLoanDialog loanId={loanId} requestedPaise={l.requestedPaise} canChangeRate={can(org, "interest.manage")} tenure={l.tenure} rate={l.annualRate} />}
            {(l.status === "applied" || l.status === "approved") && canApprove && (
              <ActionButton path={`/orgs/${orgId}/loans/${loanId}/reject`} variant="ghost" successMessage="Loan rejected" confirm={{ title: "Reject this loan?", reason: "required", destructive: true, confirmLabel: "Reject" }}>
                Reject
              </ActionButton>
            )}
            {l.status === "approved" && canApprove && <DisburseLoanDialog loanId={loanId} accounts={active} amountPaise={l.approvedPaise ?? 0} />}
            {l.status === "active" && can(org, "interest.manage") && writable && (l.interestMethod === "reducing_balance" || l.interestMethod === "simple") && <RateChangeDialog loanId={loanId} />}
            {l.status === "active" && can(org, "payments.record") && writable && (
              <RepayLoanDialog loanId={loanId} accounts={active} methods={org.settings.paymentMethods} nextDuePaise={l.summary?.overdueAmountPaise || l.summary?.nextDue?.amountPaise || 0} allowPrepay={l.interestMethod !== "compound"} />
            )}
          </>
        }
      />
      {l.status === "applied" && <p className="mb-3 text-sm text-muted-foreground">Requested {formatINR(l.requestedPaise)} — awaiting approval.</p>}
      <LoanDetail
        data={data}
        orgId={orgId}
        receiptBase={`/org/${orgId}/receipts`}
        repaymentAction={(r, isLatest) =>
          isLatest && r.status === "verified" && can(org, "payments.reverse") && writable ? (
            <ActionButton path={`/orgs/${orgId}/loans/${loanId}/repayments/${r._id}/reverse`} size="xs" variant="ghost" successMessage="Repayment reversed" confirm={{ title: "Reverse this repayment?", description: "The schedule is restored to how it was before this payment, and a reversal entry is posted.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
              Reverse
            </ActionButton>
          ) : null
        }
      />
    </>
  );
}
