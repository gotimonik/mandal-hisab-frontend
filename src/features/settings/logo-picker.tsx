"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadOrgLogo } from "@/app/actions/api";
import { apiMutate } from "@/lib/api-client";

const MAX_BYTES = 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Pick a logo image (max 1 MB); it's uploaded straight away and stored in Vercel Blob by the API. */
export function LogoPicker({ orgId, initialUrl }: { orgId: string; initialUrl: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const pick = (f: File) => {
    setError(null);
    if (!TYPES.includes(f.type)) return setError("Choose a PNG, JPEG or WEBP image");
    if (f.size > MAX_BYTES) return setError(`This image is ${mb(f.size)}. The logo must be 1 MB or smaller.`);
    const fd = new FormData();
    fd.set("file", f);
    start(async () => {
      const r = await uploadOrgLogo(orgId, fd);
      if (!r.ok) return setError(r.error);
      setUrl(r.data.logoUrl);
      toast.success("Logo updated");
      router.refresh();
    });
  };

  const remove = () =>
    start(async () => {
      setError(null);
      const r = await apiMutate({ path: `/orgs/${orgId}/logo`, method: "DELETE" });
      if (!r.ok) return setError(r.error);
      setUrl(null);
      toast.success("Logo removed");
      router.refresh();
    });

  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
      <Label htmlFor="o-logo">Logo</Label>
      <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-foreground/[0.06]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- a Vercel Blob URL, already small (≤ 1 MB)
            <img src={url} alt="Mandal logo" className="size-full object-contain" />
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
          <p className="text-xs text-muted-foreground">PNG, JPEG or WEBP, up to 1 MB. A square image looks best.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="rounded-xl" disabled={busy} onClick={() => input.current?.click()}>
              <Upload /> {url ? "Change" : "Upload logo"}
            </Button>
            {url && (
              <Button type="button" size="sm" variant="ghost" className="rounded-xl text-destructive hover:text-destructive" disabled={busy} onClick={remove}>
                <Trash2 /> Remove
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
