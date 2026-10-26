import { Suspense } from "react";
import { cache } from "react";
import { getMe, getOrg } from "@/lib/server/data";
import { api } from "@/lib/server/api";
import { buildNav, buildQuickActions } from "@/lib/nav";
import { getT } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";
import { LangBoundary } from "@/i18n/boundary";
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
      <LangBoundary>{children}</LangBoundary>
    </ShellFrame>
  );
}

type P = { params: Promise<{ orgId: string }> };

/** Request-scoped: all shell pieces share one set of API calls. */
const loadShell = cache(async (orgId: string): Promise<ShellData> => {
  const [org, me, notes, { t, lang }] = await Promise.all([getOrg(orgId), getMe(), api<{ unread: number }>(`/notifications?orgId=${orgId}&unread=true`), getT()]);
  return {
    org: { id: org.id, name: org.name, role: org.myRole, status: org.status },
    orgs: me.organizations.filter((o) => o.membershipStatus === "active").map((o) => ({ id: o.id, name: o.name, role: o.role, status: o.status })),
    nav: buildNav(org.id, org.myPermissions, org.myRole, t),
    quick: buildQuickActions(org.id, org.myPermissions, org.myRole, { live: org.status === "active", memberRequests: !!org.settings.fundLoans?.allowMemberRequests }, t),
    lang,
    user: { name: me.user.name, email: me.user.email, isPlatformAdmin: me.user.isPlatformAdmin },
    unread: notes.unread,
  };
});

async function Sidebar({ params }: P) {
  const data = await loadShell((await params).orgId);
  return (
    <I18nProvider lang={data.lang}>
      <SidebarContent data={data} />
    </I18nProvider>
  );
}
async function MobileHeader({ params }: P) {
  const data = await loadShell((await params).orgId);
  return (
    <I18nProvider lang={data.lang}>
      <MobileHeaderContent data={data} />
    </I18nProvider>
  );
}
async function Topbar({ params }: P) {
  const data = await loadShell((await params).orgId);
  return (
    <I18nProvider lang={data.lang}>
      <TopbarContent data={data} />
    </I18nProvider>
  );
}
async function BottomNav({ params }: P) {
  const data = await loadShell((await params).orgId);
  return (
    <I18nProvider lang={data.lang}>
      <BottomNavContent data={data} />
    </I18nProvider>
  );
}

async function StatusBanner({ params }: P) {
  const [org, { t }] = await Promise.all([getOrg((await params).orgId), getT()]);
  if (org.status === "pending")
    return (
      <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
        {t("shell.pendingApproval")}
      </div>
    );
  if (org.status === "archived") return <div className="mb-4 rounded-lg bg-muted px-3 py-2 text-sm">{t("shell.archived")}</div>;
  return null;
}

/** "Ramesh invited you to join Shree Ganesh Mandal" — for people already using the app. */
async function InvitationsBanner() {
  const [me, { t }] = await Promise.all([getMe(), getT()]);
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
            <b>{t("shell.invitedYou", { who: i.invitedByName ?? t("shell.someone"), org: i.organization.name })}</b>
            <span className="block text-xs text-muted-foreground">{t("shell.asRole", { role: i.role === "admin" || i.role === "manager" || i.role === "member" ? t(`shell.roles.${i.role}`) : i.role })}</span>
          </p>
          <div className="flex gap-2">
            <ActionButton path={`/invitations/${i.id}/decline`} variant="ghost" successMessage={t("shell.declined")}>
              {t("shell.decline")}
            </ActionButton>
            <ActionButton path={`/invitations/${i.id}/accept`} variant="default" successMessage={t("shell.welcomeTo", { org: i.organization.name })} redirectTo={`/org/${i.organization._id}`}>
              {t("shell.join")}
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
