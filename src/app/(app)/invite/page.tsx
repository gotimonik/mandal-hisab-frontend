import { redirect } from "next/navigation";
import { ApiError, apiCall, qs } from "@/lib/server/api";
import { InviteAccept, type InvitePreview } from "@/features/onboarding/invite-accept";

export const metadata = { title: "Invitation" };

export default async function InvitePage({ searchParams }: PageProps<"/invite">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  let preview: InvitePreview | null = null;
  let error: string | null = token ? null : "This invitation link is incomplete. Ask the Mandal admin to send it again.";
  let signedOut = false;
  if (token) {
    try {
      preview = await apiCall<InvitePreview>(`/invitations/preview${qs({ token })}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) signedOut = true;
      else error = e instanceof ApiError ? e.message : "Could not open this invitation.";
    }
  }
  if (signedOut) redirect(`/login?expired=1&next=${encodeURIComponent(`/invite?token=${token}`)}`);
  return <InviteAccept token={token} preview={preview} error={error} />;
}
