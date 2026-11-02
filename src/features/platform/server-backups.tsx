import { DatabaseBackup, Download, ShieldCheck, TriangleAlert } from "lucide-react";
import { api } from "@/lib/server/api";
import { ActionButton } from "@/components/app/action-button";
import { IconChip } from "@/components/app/bits";
import { formatDateTime } from "@/lib/format";

interface ServerBackups {
  configured: boolean;
  keepDays: number;
  /** no backup in the last 36 hours */
  stale: boolean;
  items: { name: string; sizeBytes: number; uploadedAt: string }[];
}

const size = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/**
 * Platform panel: the nightly encrypted copies of the whole database (kept 30 days outside
 * MongoDB Atlas). Restoring: npm run backup:restore-server (one Mandal, or everything).
 */
export async function ServerBackups() {
  const data = await api<ServerBackups>("/platform/server-backups").catch(() => null);
  if (!data) return null;
  const latest = data.items[0];
  const stale = data.stale;
  return (
    <section className="mt-6 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5" aria-label="Server backups">
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <IconChip tone={data.configured && !stale ? "emerald" : "amber"}>{data.configured ? <DatabaseBackup /> : <TriangleAlert />}</IconChip>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Server backups</h2>
          <p className="text-sm text-muted-foreground">
            Every night at 6:00 am the whole database (every Mandal) is copied, encrypted, outside MongoDB Atlas. The last {data.keepDays} days are kept.
          </p>
        </div>
        {data.configured && (
          <ActionButton path="/platform/server-backups" size="sm" successMessage="Backup taken">
            <DatabaseBackup /> Back up now
          </ActionButton>
        )}
      </div>

      {!data.configured ? (
        <p className="rounded-xl bg-amber-500/10 px-3.5 py-3 text-sm ring-1 ring-amber-500/30">
          <b>Not set up yet.</b> Add <code className="rounded bg-muted px-1">BACKUP_ENCRYPTION_KEY</code> (any long random text, 32+ characters) to the backend&apos;s environment in Vercel and keep a copy of it somewhere safe outside Vercel — without it the backups can&apos;t be opened. File storage (<code className="rounded bg-muted px-1">BLOB_READ_WRITE_TOKEN</code>) must be set too.
        </p>
      ) : data.items.length === 0 ? (
        <p className="rounded-xl bg-amber-500/10 px-3.5 py-3 text-sm ring-1 ring-amber-500/30">No backup yet — the first one is taken tonight, or now with “Back up now”.</p>
      ) : (
        <>
          <p className={`mb-2 flex items-center gap-1.5 text-sm ${stale ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}>
            {stale ? <TriangleAlert className="size-4" /> : <ShieldCheck className="size-4" />}
            {stale ? "The last backup is more than a day old — check the daily job." : `Last backup ${formatDateTime(latest!.uploadedAt)}`}
          </p>
          <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
            {data.items.slice(0, 10).map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  {formatDateTime(f.uploadedAt)}
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {f.name} · {size(f.sizeBytes)}
                  </span>
                </span>
                <a href={`/api/platform/server-backup?name=${encodeURIComponent(f.name)}`} className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold hover:bg-muted/70">
                  <Download className="size-3.5" /> Download
                </a>
              </li>
            ))}
          </ul>
          {data.items.length > 10 && <p className="mt-1 text-xs text-muted-foreground">+ {data.items.length - 10} older</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            To restore: <code className="rounded bg-muted px-1">npm run backup:restore-server -- &lt;file&gt; --dry-run</code>, then with <code className="rounded bg-muted px-1">--mandal &lt;join code&gt;</code> for one Mandal, or without it for everything.
          </p>
        </>
      )}
    </section>
  );
}
