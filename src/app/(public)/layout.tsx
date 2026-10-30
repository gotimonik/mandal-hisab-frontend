import { PublicShell } from "@/features/public/shell";
import { AdSense } from "@/components/app/adsense";

/** Website pages: Home, Features, Guides, How it works, Benefits, Glossary, Download, About, FAQ, Contact, Privacy, Terms. Ads (when set up) load only here. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <PublicShell language={false}>
      {children}
      <AdSense />
    </PublicShell>
  );
}
