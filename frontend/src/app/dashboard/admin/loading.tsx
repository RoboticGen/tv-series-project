import { OfflineLoadingNotice } from "@/components/offline-banner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <OfflineLoadingNotice />
      <div>
        <Skeleton className="h-8 w-56 rounded-lg" />
        <div className="mt-12 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
