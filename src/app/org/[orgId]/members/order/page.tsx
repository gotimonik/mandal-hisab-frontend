import { api, qs } from "@/lib/server/api";
import { can, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { FormNote } from "@/components/app/form-bits";
import { ReorderForm, type OrderRow } from "@/features/members/reorder-form";

export const metadata = { title: "Order of members" };

export default async function MemberOrderPage({ params }: PageProps<"/org/[orgId]/members/order">) {
  const { orgId } = await params;
  const org = await getOrg(orgId);
  if (!can(org, "members.manage")) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Order of members" />
        <FormNote tone="warn">Only the Mandal&apos;s admin can change the order.</FormNote>
      </div>
    );
  }
  // every member, already in the Mandal's order
  const rows: OrderRow[] = [];
  for (let page = 1; page <= 25; page++) {
    const r = await api<{ items: OrderRow[]; total: number }>(`/orgs/${orgId}/members${qs({ page, pageSize: 200 })}`);
    rows.push(...r.items.map((m) => ({ _id: m._id, membershipNumber: m.membershipNumber, name: m.name })));
    if (rows.length >= r.total || r.items.length === 0) break;
  }
  return (
    <div className="max-w-2xl">
      <PageHeader title="Order of members" description="Drag members into the order you want. The members list, the hisab sheet and the monthly hapta follow it." />
      <ReorderForm orgId={orgId} rows={rows} />
    </div>
  );
}
