"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/client";
import { uploadOrgLogo } from "@/app/actions/api";
import { apiMutate } from "@/lib/api-client";

const MAX_BYTES = 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Pick a logo image (max 1 MB); it's uploaded straight away and stored in Vercel Blob by the API. */
export function LogoPicker({ orgId, initialUrl }: { orgId: string; initialUrl: string | null }) {
  const router = useRouter();
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const pick = (f: File) => {
    setError(null);
    if (!TYPES.includes(f.type)) return setError(t("setd.logo.type"));
    if (f.size > MAX_BYTES) return setError(t("setd.logo.big", { size: mb(f.size) }));
    const fd = new FormData();
    fd.set("file", f);
    start(async () => {
      const r = await uploadOrgLogo(orgId, fd);
      if (!r.ok) return setError(r.error);
      setUrl(r.data.logoUrl);
      toast.success(t("setd.logo.updated"));
      router.refresh();
    });
  };

  const remove = () =>
    start(async () => {
      setError(null);
      const r = await apiMutate({ path: `/orgs/${orgId}/logo`, method: "DELETE" });
      if (!r.ok) return setError(r.error);
      setUrl(null);
      toast.success(t("setd.logo.removed"));
      router.refresh();
    });

  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
      <Label htmlFor="o-logo">{t("setd.logo.label")}</Label>
      <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-foreground/[0.06]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- a Vercel Blob URL, already small (≤ 1 MB)
            <img src={url} alt={t("setd.logo.alt")} className="size-full object-contain" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-card/70">
              <Loader2 className="size-5 animate-spin text-primary" />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t("setd.logo.hint")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="rounded-xl" disabled={busy} onClick={() => input.current?.click()}>
              <Upload /> {url ? t("setd.logo.change") : t("setd.logo.upload")}
            </Button>
            {url && (
              <Button type="button" size="sm" variant="ghost" className="rounded-xl text-destructive hover:text-destructive" disabled={busy} onClick={remove}>
                <Trash2 /> {t("setd.logo.remove")}
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      <input
        ref={input}
        id="o-logo"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ""; // picking the same file again still fires onChange
          if (f) pick(f);
        }}
      />
    </div>
  );
}
