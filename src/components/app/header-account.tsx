import { getMe } from "@/lib/server/data";
import { AccountMenu } from "./account-menu";

/** The signed-in person for the top bar's account menu (streams in; the bar shows straight away). */
export async function HeaderAccount() {
  const me = await getMe();
  return <AccountMenu user={{ name: me.user.name, email: me.user.email, isPlatformAdmin: me.user.isPlatformAdmin }} />;
}
