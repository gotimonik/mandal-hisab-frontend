import { api, qs } from "@/lib/server/api";
import { can, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { FormNote } from "@/components/app/form-bits";
import { RenameForm, type RenameRow } from "@/features/members/rename-form";

export const metadata = { title: "Edit member names" };

export default async function MemberNamesPage({ params }: PageProps<"/org/[orgId]/members/names">) {
  const { orgId } = await params;
  const org = await getOrg(orgId);
  if (!can(org, "members.manage")) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Edit member names" />
        <FormNote tone="warn">Only the Mandal&apos;s admin can change member names.</FormNote>
      </div>
    );
  }
  // every member, in pages of 200
  const rows: RenameRow[] = [];
  for (let page = 1; page <= 25; page++) {
    const r = await api<{ items: RenameRow[]; total: number }>(`/orgs/${orgId}/members${qs({ page, pageSize: 200 })}`);
    rows.push(...r.items.map((m) => ({ _id: m._id, membershipNumber: m.membershipNumber, name: m.name, nameEnglish: m.nameEnglish ?? null })));
    if (rows.length >= r.total || r.items.length === 0) break;
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title="Edit member names" description="Change all the names at once — for example to Gujarati. Type them here, or paste a list." />
      <RenameForm orgId={orgId} rows={rows} />
    </div>
  );
}
