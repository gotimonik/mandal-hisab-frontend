import { Suspense, type ReactNode } from "react";
import { I18nProvider } from "./client";
import { getLang } from "./server";

async function WithLang({ children }: { children: ReactNode }) {
  return <I18nProvider lang={await getLang()}>{children}</I18nProvider>;
}

/** Wrap a subtree so its client components get the person's language. */
export function LangBoundary({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <WithLang>{children}</WithLang>
    </Suspense>
  );
}
