import { Suspense, type ReactNode } from "react";
import { I18nProvider } from "./client";
import { getLang } from "./server";
import { clientDict } from "./dicts";

async function WithLang({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <I18nProvider lang={lang} dict={clientDict(lang)}>
      {children}
    </I18nProvider>
  );
}

/** Wrap a subtree so its client components get the person's language. */
export function LangBoundary({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <WithLang>{children}</WithLang>
    </Suspense>
  );
}
