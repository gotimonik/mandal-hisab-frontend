"use client";

import { PageError } from "@/components/app/page-error";

/** Personal Hisab, the Mandal list, Account …: a page that couldn't load gets a real "Try again". */
export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} />;
}
