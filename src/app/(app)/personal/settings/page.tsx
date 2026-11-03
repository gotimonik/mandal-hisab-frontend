import { redirect } from "next/navigation";

/** Wallets, categories and budgets now each have their own page. */
export default function PersonalSettingsRedirect() {
  redirect("/personal/wallets");
}
