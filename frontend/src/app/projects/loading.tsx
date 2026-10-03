import { OfflineLoadingNotice } from "@/components/offline-banner";
import { ProjectCardSkeleton } from "@/components/project-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <OfflineLoadingNotice />
      <div aria-hidden="true">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="mt-1 h-4 w-80 rounded" />
        <Skeleton className="mt-6 h-9 w-full max-w-md rounded-md" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-sm" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
