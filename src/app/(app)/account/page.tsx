import { api } from "@/lib/server/api";
import type { Me } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm, PasswordForm } from "@/features/account/account-forms";
import { ActionButton } from "@/components/app/action-button";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await api<Me>("/auth/me");
  return (
    <>
      <PageHeader title="Your account" description={me.user.email} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            {!me.user.emailVerified && <CardDescription>Your email address is not verified yet.</CardDescription>}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ProfileForm name={me.user.name} phone={me.user.phone ?? ""} />
            {!me.user.emailVerified && (
              <ActionButton path="/auth/resend-verification" successMessage="Verification email sent">
                Resend verification email
              </ActionButton>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Changing your password signs you out everywhere.</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Sign out of every device, including this one.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionButton path="/auth/logout-all" redirectTo="/login" successMessage="Signed out everywhere" confirm={{ title: "Sign out everywhere?", destructive: true, confirmLabel: "Sign out all" }}>
              Sign out all devices
            </ActionButton>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
