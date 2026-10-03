import { FeaturedSpotlightSkeleton } from "@/features/projects/components/featured-spotlight";
import { OfflineLoadingNotice } from "@/shared/components/offline-banner";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your dashboard"
      className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6 sm:py-10"
    >
      <OfflineLoadingNotice className="-mb-6" />
      <Skeleton className="h-56 rounded-2xl bg-brand-teal/30" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Skeleton className="h-52 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      <FeaturedSpotlightSkeleton />
    </div>
  );
}
