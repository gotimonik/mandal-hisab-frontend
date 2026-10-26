import { api } from "@/lib/server/api";
import { getActiveMembers, getMe, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { TableWrap } from "@/components/app/table-wrap";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { ActionButton } from "@/components/app/action-button";
import { InviteDialog, ManageMembershipDialog } from "@/features/users/membership-dialogs";

export const metadata = { title: "Users & joining" };

interface Invitation {
  _id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

interface Membership {
  _id: string;
  role: string;
  status: string;
  requestMessage?: string;
  createdAt: string;
  memberId?: string | null;
  user: { _id: string; name: string; email: string; phone?: string };
  member?: { _id: string; name: string; membershipNumber: string } | null;
}

export default async function UsersPage({ params }: PageProps<"/org/[orgId]/users">) {
  const { orgId } = await params;
  const [org, me, list, members, invitations] = await Promise.all([getOrg(orgId), getMe(), api<Membership[]>(`/orgs/${orgId}/memberships`), getActiveMembers(orgId), api<Invitation[]>(`/orgs/${orgId}/invitations`)]);
  const joinOpts = { autoCreateMember: org.settings.membership.autoCreateMember, hasMonthlyHapta: !!org.settings.monthlyHapta };
  const mems = members.map((m) => ({ _id: m._id, name: m.name, membershipNumber: m.membershipNumber }));
  const pending = list.filter((m) => m.status === "pending");
  const others = list.filter((m) => m.status !== "pending");
  return (
    <>
      <PageHeader title="Users & joining" description="People who can sign in to this Mandal, join requests and invitations." actions={<InviteDialog members={mems} />} />
      <Card size="sm" className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            Organization code: <span className="font-mono text-base font-semibold tracking-wider">{org.code}</span>
          </span>
          <span className="text-muted-foreground">{org.settings.membership.allowJoinRequests ? "People can search the Mandal's name or enter this code to request to join. You approve each request." : "Join requests are turned off in Settings — invite people instead."}</span>
        </CardContent>
      </Card>
      {pending.length > 0 && (
        <>
          <h2 className="mb-2 font-semibold">Join requests ({pending.length})</h2>
          <ul className="mb-6 divide-y rounded-xl ring-1 ring-warning/40">
            {pending.map((m) => (
              <li key={m._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{m.user.name}</span> <span className="text-muted-foreground">{m.user.email}</span>
                  {m.requestMessage && <span className="block text-xs text-muted-foreground">“{m.requestMessage}”</span>}
                  <span className="block text-xs text-muted-foreground">Requested {formatDate(m.createdAt)}</span>
                </span>
                <ManageMembershipDialog membershipId={m._id} name={m.user.name} status={m.status} role={m.role} memberId={m.memberId} members={mems} isSelf={false} {...joinOpts} />
              </li>
            ))}
          </ul>
        </>
      )}
      {invitations.length > 0 && (
        <>
          <h2 className="mb-2 font-semibold">Open invitations ({invitations.length})</h2>
          <ul className="mb-6 divide-y rounded-xl ring-1 ring-foreground/10">
            {invitations.map((i) => (
              <li key={i._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <span>
                  <span className="font-medium">{i.email}</span> <span className="text-muted-foreground capitalize">· {i.role}</span>
                  <span className="block text-xs text-muted-foreground">Sent {formatDate(i.createdAt)} · expires {formatDate(i.expiresAt)}</span>
                </span>
                <ActionButton path={`/orgs/${orgId}/invitations/${i._id}/revoke`} size="xs" variant="ghost" successMessage="Invitation revoked" confirm={{ title: `Revoke the invitation for ${i.email}?`, confirmLabel: "Revoke", destructive: true }}>
                  Revoke
                </ActionButton>
              </li>
            ))}
          </ul>
        </>
      )}
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Member record</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {others.map((m) => (
              <TableRow key={m._id}>
                <TableCell>
                  <div className="font-medium">{m.user.name}</div>
                  <div className="text-xs text-muted-foreground">{m.user.email}</div>
                </TableCell>
                <TableCell className="capitalize">{m.role}</TableCell>
                <TableCell>{m.member ? `${m.member.name} (${m.member.membershipNumber})` : m.status === "active" ? <span className="text-warning">No member record — use ⚙ to add</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <StatusBadge status={m.status} />
                </TableCell>
                <TableCell className="text-right">{m.status !== "rejected" && <ManageMembershipDialog membershipId={m._id} name={m.user.name} status={m.status} role={m.role} memberId={m.memberId} members={mems} isSelf={m.user._id === me.user.id} {...joinOpts} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </>
  );
}
