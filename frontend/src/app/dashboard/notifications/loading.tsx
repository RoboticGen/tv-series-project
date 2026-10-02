import { OfflineLoadingNotice } from "@/components/offline-banner";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <OfflineLoadingNotice />
      <div className="animate-pulse">
        <div className="h-9 w-56 rounded-lg bg-muted" />
        <div className="mt-8 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
