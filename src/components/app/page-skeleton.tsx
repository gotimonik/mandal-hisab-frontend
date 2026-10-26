import { Skeleton } from "@/components/ui/skeleton";

/** Default per-page loading UI: shown immediately on navigation while the page's data streams in. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
