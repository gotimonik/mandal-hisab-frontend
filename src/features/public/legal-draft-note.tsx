import { PlaceholderTag } from "./blocks";
import { site } from "@/config/site";

/** "Last updated" line at the top of Privacy and Terms. */
export function LegalUpdated() {
  return <p className="mb-6 text-sm text-muted-foreground">Last updated: {site.legal.lastUpdated}</p>;
}

/** A legal placeholder value, with the dev-only tag. */
export function L({ v }: { v: string }) {
  return (
    <>
      {v}
      <PlaceholderTag value={v} />
    </>
  );
}
