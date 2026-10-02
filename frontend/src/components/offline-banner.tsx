"use client";

import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Shown on every route while the connection is down (experimental.useOffline in next.config.ts).
export function OfflineBanner() {
  const isOffline = useOffline();

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {isOffline && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg border-2 border-brand-navy bg-brand-yellow px-4 py-2.5 text-sm font-bold text-brand-navy shadow-[4px_4px_0_0_var(--brand-navy)] dark:border-edge dark:shadow-[4px_4px_0_0_var(--edge)]">
          <WifiOff className="size-4 shrink-0" aria-hidden />
          <span>
            You&apos;re offline.{" "}
            <span className="font-medium">We&apos;ll pick up where you left off once you&apos;re back.</span>
          </span>
        </div>
      )}
    </div>
  );
}

// For loading.tsx skeletons
export function OfflineLoadingNotice({ className }: { className?: string }) {
  const isOffline = useOffline();
  if (!isOffline) return null;
  return (
    <p className={cn("mb-6 flex items-center gap-2 text-sm font-bold text-muted-foreground", className)}>
      <WifiOff className="size-4 shrink-0" aria-hidden />
      Waiting for a internet connection to load this page…
    </p>
  );
}
