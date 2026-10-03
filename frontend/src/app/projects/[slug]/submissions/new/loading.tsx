import { OfflineLoadingNotice } from "@/components/offline-banner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <OfflineLoadingNotice />
      <div>
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="mt-8 h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}
