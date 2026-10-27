import { KeyRound, Mail, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/server/api";
import { getActiveMembers, getMe, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { TableWrap } from "@/components/app/table-wrap";
import { EmptyState } from "@/components/app/empty-state";
import { CountPill, IconChip, MemberAvatar, SectionTitle } from "@/components/app/bits";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TONE_CHIP, type Tone } from "@/lib/tones";
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

const ROLE_TONE: Record<string, Tone> = {
  admin: "violet",
  manager: "sky",
  member: "emerald",
};
function RoleBadge({ role }: { role: string }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", TONE_CHIP[ROLE_TONE[role] ?? "slate"])}>{role}</span>;
}

export default async function UsersPage({ params }: PageProps<"/org/[orgId]/users">) {
  const { orgId } = await params;
  const [org, me, list, members, invitations] = await Promise.all([
    getOrg(orgId),
    getMe(),
    api<Membership[]>(`/orgs/${orgId}/memberships`),
    getActiveMembers(orgId),
    api<Invitation[]>(`/orgs/${orgId}/invitations`),
  ]);
  const joinOpts = {
    autoCreateMember: org.settings.membership.autoCreateMember,
    hasMonthlyHapta: !!org.settings.monthlyHapta,
  };
  const mems = members.map((m) => ({
    _id: m._id,
    name: m.name,
    membershipNumber: m.membershipNumber,
  }));
  const pending = list.filter((m) => m.status === "pending");
  const others = list.filter((m) => m.status !== "pending");
  const memberRecord = (m: Membership) =>
    m.member ? (
      <>
        {m.member.name} <span className="text-muted-foreground">({m.member.membershipNumber})</span>
      </>
    ) : m.status === "active" ? (
      <span className="text-warning-ink">No member record — use ⚙ to add</span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  const manage = (m: Membership) =>
    m.status !== "rejected" ? (
      <ManageMembershipDialog membershipId={m._id} name={m.user.name} status={m.status} role={m.role} memberId={m.memberId} members={mems} isSelf={m.user._id === me.user.id} {...joinOpts} />
    ) : null;

  return (
    <>
      <PageHeader title="Users & joining" description="People who can sign in to this Mandal, join requests and invitations." actions={<InviteDialog members={mems} />} />

      <section className="mb-5 flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:flex-row sm:items-center">
        <IconChip tone="indigo" size="lg">
          <KeyRound />
        </IconChip>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">Organization code</p>
          <p className="font-mono text-2xl font-bold tracking-[0.2em]">{org.code}</p>
        </div>
        <p className="text-sm text-muted-foreground sm:max-w-sm">
          {org.settings.membership.allowJoinRequests
            ? "People can search the Mandal's name or enter this code to request to join. You approve each request."
            : "Join requests are turned off in Settings — invite people instead."}
        </p>
      </section>

      {pending.length > 0 && (
        <section className="mb-6">
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              Join requests <CountPill n={pending.length} tone="amber" />
            </span>
          </SectionTitle>
          <ul className="flex flex-col gap-2">
            {pending.map((m) => (
              <li key={m._id} className="flex flex-col gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-2 ring-amber-400/40 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <MemberAvatar name={m.user.name} />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">{m.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                    {m.requestMessage && <p className="mt-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">“{m.requestMessage}”</p>}
                    <p className="mt-1 text-xs text-muted-foreground">Requested {formatDate(m.createdAt)}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <ManageMembershipDialog membershipId={m._id} name={m.user.name} status={m.status} role={m.role} memberId={m.memberId} members={mems} isSelf={false} {...joinOpts} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {invitations.length > 0 && (
        <section className="mb-6">
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              Open invitations <CountPill n={invitations.length} tone="sky" />
            </span>
          </SectionTitle>
          <ul className="flex flex-col gap-2">
            {invitations.map((i) => (
              <li key={i._id} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
                <IconChip tone="sky" size="sm">
                  <Mail />
                </IconChip>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{i.email}</span> <RoleBadge role={i.role} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDate(i.createdAt)} · expires {formatDate(i.expiresAt)}
                  </p>
                </div>
                <ActionButton
                  path={`/orgs/${orgId}/invitations/${i._id}/revoke`}
                  size="xs"
                  variant="ghost"
                  successMessage="Invitation revoked"
                  confirm={{
                    title: `Revoke the invitation for ${i.email}?`,
                    confirmLabel: "Revoke",
                    destructive: true,
                  }}
                >
                  Revoke
                </ActionButton>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          People with access <CountPill n={others.length} tone="indigo" />
        </span>
      </SectionTitle>
      {others.length === 0 ? (
        <EmptyState icon={<Users />} title="No one else has access yet" description="Invite people, or share the organization code so they can ask to join." action={<InviteDialog members={mems} />} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Users">
            {others.map((m) => (
              <li key={m._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", m.status !== "active" && "opacity-75")}>
                <div className="flex items-start gap-3">
                  <MemberAvatar name={m.user.name} />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">
                      {m.user.name}
                      {m.user._id === me.user.id && <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                    <p className="mt-1 text-xs">{memberRecord(m)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <RoleBadge role={m.role} />
                    <StatusBadge status={m.status} />
                  </div>
                </div>
                <div className="mt-2 flex justify-end empty:hidden">{manage(m)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
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
                    <TableRow key={m._id} className={cn(m.status !== "active" && "text-muted-foreground")}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar name={m.user.name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold">
                              {m.user.name}
                              {m.user._id === me.user.id && <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{m.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={m.role} />
                      </TableCell>
                      <TableCell className="whitespace-normal">{memberRecord(m)}</TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} />
                      </TableCell>
                      <TableCell className="text-right">{manage(m)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
      {pending.length === 0 && invitations.length === 0 && others.length > 0 && (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <UserPlus className="size-4" /> No join requests or open invitations right now.
        </p>
      )}
    </>
  );
}
