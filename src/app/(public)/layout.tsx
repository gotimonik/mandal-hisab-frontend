import { PublicShell } from "@/features/public/shell";

/** Marketing / information pages: Home, Features, Download, About, FAQ, Contact, Privacy, Terms. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return <PublicShell>{children}</PublicShell>;
}
