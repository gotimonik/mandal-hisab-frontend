"use client";

import { PageError } from "@/components/app/page-error";

/** A Mandal page that couldn't load (no internet, server busy …): retry for real, or by itself once back online. */
export default function OrgError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} />;
}
