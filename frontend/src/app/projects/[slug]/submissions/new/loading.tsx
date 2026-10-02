import { OfflineLoadingNotice } from "@/components/offline-banner";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <OfflineLoadingNotice />
      <div className="animate-pulse">
        <div className="h-8 w-2/3 rounded-lg bg-muted" />
        <div className="mt-8 h-96 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}
