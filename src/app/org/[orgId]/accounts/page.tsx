import Link from "next/link";
import { Landmark, Smartphone, Wallet, CircleDollarSign } from "lucide-react";
import { getAccounts, getOrg, can } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { ActionButton } from "@/components/app/action-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { NewAccountDialog, TransferDialog, AdjustDialog } from "@/features/accounts/account-dialogs";

export const metadata = { title: "Accounts" };

const ICON = { cash: Wallet, bank: Landmark, upi: Smartphone, other: CircleDollarSign };

export default async function AccountsPage({ params }: PageProps<"/org/[orgId]/accounts">) {
  const { orgId } = await params;
  const [org, accounts] = await Promise.all([getOrg(orgId), getAccounts(orgId)]);
  const active = accounts.filter((a) => a.isActive).map((a) => ({ _id: a._id, name: a.name }));
  const total = accounts.reduce((s, a) => s + a.balancePaise, 0);
  const writable = org.status === "active";
  return (
    <>
      <PageHeader
        title="Accounts"
        description={
          <>
            Cash, bank and UPI accounts. Total: <Money paise={total} className="font-medium text-foreground" />. Balances are calculated from the ledger and cannot be edited directly.
          </>
        }
        actions={
          writable ? (
            <>
              {can(org, "transactions.adjust") && active.length > 0 && <AdjustDialog accounts={active} />}
              {can(org, "accounts.manage") && active.length > 1 && <TransferDialog accounts={active} />}
              {can(org, "accounts.manage") && <NewAccountDialog />}
            </>
          ) : null
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a) => {
          const Icon = ICON[a.type];
          return (
            <Card key={a._id} className={a.isActive ? "" : "opacity-60"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" /> {a.name}
                </CardTitle>
                <CardDescription>
                  {a.type === "bank" ? [a.bankName, a.accountNumberLast4 && `••${a.accountNumberLast4}`, a.ifsc].filter(Boolean).join(" · ") : a.type === "upi" ? a.upiId : a.type}
                  {!a.isActive && <StatusBadge status="inactive" className="ml-2" />}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Money paise={a.balancePaise} className="text-2xl font-semibold" />
                <div className="grid grid-cols-2 text-xs text-muted-foreground">
                  <span>
                    In <Money paise={a.totalInPaise} />
                  </span>
                  <span>
                    Out <Money paise={a.totalOutPaise} />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Opening <Money paise={a.openingBalancePaise} /> on {formatDate(a.openingDate)}
                </p>
                <div className="flex gap-2">
                  <Link href={`/org/${orgId}/transactions?accountId=${a._id}`} className="text-xs font-medium text-primary hover:underline">
                    View transactions
                  </Link>
                  {can(org, "accounts.manage") && writable && (
                    <ActionButton path={`/orgs/${orgId}/accounts/${a._id}`} method="PATCH" body={{ isActive: !a.isActive }} size="xs" variant="ghost" successMessage={a.isActive ? "Account deactivated" : "Account reactivated"}>
                      {a.isActive ? "Deactivate" : "Reactivate"}
                    </ActionButton>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
