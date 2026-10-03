import { OfflineLoadingNotice } from "@/shared/components/offline-banner";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <OfflineLoadingNotice />
      <div>
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="mt-4 h-9 w-2/3 rounded-lg" />
        <Skeleton className="mt-3 h-4 w-full rounded" />
        <Skeleton className="mt-1 h-4 w-4/5 rounded" />
        <Skeleton className="mt-8 h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
