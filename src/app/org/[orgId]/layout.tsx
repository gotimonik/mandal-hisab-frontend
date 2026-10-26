import { Suspense } from "react";
import { cache } from "react";
import { getMe, getOrg } from "@/lib/server/data";
import { api } from "@/lib/server/api";
import { buildNav, buildQuickActions } from "@/lib/nav";
import { BottomNavContent, MobileHeaderContent, ShellFrame, SidebarContent, TopbarContent, type ShellData } from "@/components/app/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { MailOpen } from "lucide-react";
import { ActionButton } from "@/components/app/action-button";

/**
 * The frame and {children} render without waiting for the session. Everything that
 * depends on the signed-in user (org, permissions-filtered nav, unread count) is read
 * inside its own <Suspense> boundary, so navigations between pages stay instant and
 * each page streams its data behind its own loading.tsx.
 */
export default function OrgLayout({ children, params }: LayoutProps<"/org/[orgId]">) {
  return (
    <ShellFrame
      sidebar={
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar params={params} />
        </Suspense>
      }
      mobileHeader={
        <Suspense fallback={<Skeleton className="h-5 flex-1" />}>
          <MobileHeader params={params} />
        </Suspense>
      }
      topbar={
        <Suspense fallback={null}>
          <Topbar params={params} />
        </Suspense>
      }
      bottomNav={
        <Suspense fallback={<BottomNavSkeleton />}>
          <BottomNav params={params} />
        </Suspense>
      }
      mobileSheet={
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar params={params} />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <StatusBanner params={params} />
      </Suspense>
      <Suspense fallback={null}>
        <InvitationsBanner />
      </Suspense>
      {children}
    </ShellFrame>
  );
}

type P = { params: Promise<{ orgId: string }> };

/** Request-scoped: all shell pieces share one set of API calls. */
const loadShell = cache(async (orgId: string): Promise<ShellData> => {
  const [org, me, notes] = await Promise.all([getOrg(orgId), getMe(), api<{ unread: number }>(`/notifications?orgId=${orgId}&unread=true`)]);
  return {
    org: { id: org.id, name: org.name, role: org.myRole, status: org.status },
    orgs: me.organizations.filter((o) => o.membershipStatus === "active").map((o) => ({ id: o.id, name: o.name, role: o.role, status: o.status })),
    nav: buildNav(org.id, org.myPermissions, org.myRole),
    quick: buildQuickActions(org.id, org.myPermissions, org.myRole, { live: org.status === "active", memberRequests: !!org.settings.fundLoans?.allowMemberRequests }),
    user: { name: me.user.name, email: me.user.email, isPlatformAdmin: me.user.isPlatformAdmin },
    unread: notes.unread,
  };
});

async function Sidebar({ params }: P) {
  return <SidebarContent data={await loadShell((await params).orgId)} />;
}
async function MobileHeader({ params }: P) {
  return <MobileHeaderContent data={await loadShell((await params).orgId)} />;
}
async function Topbar({ params }: P) {
  return <TopbarContent data={await loadShell((await params).orgId)} />;
}
async function BottomNav({ params }: P) {
  return <BottomNavContent data={await loadShell((await params).orgId)} />;
}

async function StatusBanner({ params }: P) {
  const org = await getOrg((await params).orgId);
  if (org.status === "pending")
    return (
      <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
        This organization is awaiting platform approval. You can complete settings now; recording money is enabled after approval.
      </div>
    );
  if (org.status === "archived") return <div className="mb-4 rounded-lg bg-muted px-3 py-2 text-sm">This organization is archived and read-only.</div>;
  return null;
}

/** "Ramesh invited you to join Shree Ganesh Mandal" — for people already using the app. */
async function InvitationsBanner() {
  const me = await getMe();
  const list = me.invitations ?? [];
  if (list.length === 0) return null;
  return (
    <div className="mb-4 flex flex-col gap-2">
      {list.map((i) => (
        <div key={i.id} className="flex flex-col gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-2 ring-primary/25 sm:flex-row sm:items-center">
          <span className="bg-hero flex size-10 shrink-0 items-center justify-center rounded-xl">
            <MailOpen className="size-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm">
            <b>{i.invitedByName ?? "Someone"}</b> invited you to join <b>{i.organization.name}</b>
            <span className="block text-xs text-muted-foreground capitalize">as {i.role}</span>
          </p>
          <div className="flex gap-2">
            <ActionButton path={`/invitations/${i.id}/decline`} variant="ghost" successMessage="Invitation declined">
              Decline
            </ActionButton>
            <ActionButton path={`/invitations/${i.id}/accept`} variant="default" successMessage={`Welcome to ${i.organization.name}`} redirectTo={`/org/${i.organization._id}`}>
              Join
            </ActionButton>
          </div>
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

function BottomNavSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="flex h-full items-center justify-center">
          <Skeleton className={i === 2 ? "size-12 rounded-2xl" : "size-6 rounded-full"} />
        </span>
      ))}
    </>
  );
}
