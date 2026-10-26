import { InviteAccept } from "@/features/onboarding/invite-accept";

export const metadata = { title: "Invitation" };

export default async function InvitePage({ searchParams }: PageProps<"/invite">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return <InviteAccept token={token} />;
}
