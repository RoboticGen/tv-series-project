import { OfflineLoadingNotice } from "@/components/offline-banner";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <OfflineLoadingNotice />
      <div className="animate-pulse">
        <div className="h-8 w-56 rounded-lg bg-muted" />
        <div className="mt-12 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
