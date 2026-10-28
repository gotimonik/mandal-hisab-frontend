import { InlineScript } from "@/components/app/inline-script";
import { breadcrumbLd, ldJson } from "@/lib/seo";

/** Structured data for search engines. */
export function JsonLd({ nodes }: { nodes: object[] }) {
  return <InlineScript type="application/ld+json" html={ldJson(...nodes)} />;
}

/** "Home › <page>" breadcrumb for a public page. */
export function Breadcrumb({ name, path }: { name: string; path: string }) {
  return <JsonLd nodes={[breadcrumbLd([{ name, path }])]} />;
}
