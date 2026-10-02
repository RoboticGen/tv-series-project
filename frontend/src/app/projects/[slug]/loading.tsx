import { OfflineLoadingNotice } from "@/components/offline-banner";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <OfflineLoadingNotice />
      <div className="animate-pulse">
        <div className="h-5 w-24 rounded-full bg-muted" />
        <div className="mt-4 h-9 w-2/3 rounded-lg bg-muted" />
        <div className="mt-3 h-4 w-full rounded bg-muted" />
        <div className="mt-1 h-4 w-4/5 rounded bg-muted" />
        <div className="mt-8 h-64 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}
