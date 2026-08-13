import { Skeleton } from "@qr-platform/ui";

// One shared shape for the "a panel page is still loading its data" state -
// used by every admin/business route's loading.tsx (Next.js wraps each
// route segment's Server Component render in a Suspense boundary using the
// nearest loading.tsx, so this single file covers every sub-route without
// each page needing its own). Roughly matches a typical panel page: a
// heading, a row of stat cards, and a table - close enough to avoid a
// jarring shape-swap into the real content once it arrives, without every
// page needing an exact-match skeleton of its own.
export function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Sayfa yükleniyor">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
