"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** The app was updated while this page was open: its old code files are gone, only a full reload helps. */
const staleCode = (e: Error) => /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(`${e.name} ${e.message}`);

/**
 * A page that couldn't load — usually because the internet dropped. "Try again" asks the server
 * for the page again (reset() alone only redraws the old, failed state, which left the page on its
 * loading placeholder for good). When the internet comes back it retries by itself, and if a retry
 * still fails it reloads the whole page.
 */
export function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  const router = useRouter();
  const offline = useSyncExternalStore(subscribe, () => !navigator.onLine, () => false);
  const [pending, start] = useTransition();
  const [tries, setTries] = useState(0);
  // seen offline while this was showing → retry by itself once the internet is back
  const sawOffline = useRef(false);
  const retried = useRef(false);

  const retry = () => {
    if (tries >= 1 || staleCode(error)) {
      window.location.reload();
      return;
    }
    setTries((n) => n + 1);
    start(() => {
      // fetch the page from the server again, then show it
      router.refresh();
      reset();
    });
  };

  useEffect(() => {
    console.error(error);
  }, [error]);

  // back online: try again by itself (once)
  useEffect(() => {
    if (offline) {
      sawOffline.current = true;
      return;
    }
    if (!sawOffline.current || retried.current) return;
    retried.current = true;
    const id = setTimeout(retry, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-5 sm:p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">{offline ? <WifiOff className="size-5" /> : <RefreshCw className="size-5" />}</span>
      <h2 className="font-semibold">{offline ? t("pageError.offlineTitle") : t("pageError.title")}</h2>
      <p className="text-sm text-muted-foreground">{offline ? t("pageError.offlineDesc") : error.message && !error.digest && !staleCode(error) ? error.message : t("pageError.desc")}</p>
      <Button onClick={retry} variant="outline" disabled={pending || offline}>
        {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} {t("pageError.retry")}
      </Button>
    </div>
  );
}
