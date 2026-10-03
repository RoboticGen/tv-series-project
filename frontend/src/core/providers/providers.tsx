"use client";

import { Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Celebration } from "@/features/gamification/components/celebration";
import { EarnedPointsToast } from "@/features/gamification/components/earned-points-toast";
import { Toaster } from "@/shared/components/ui/toast";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          {/* Honours the OS "reduce motion" setting for every Motion animation. */}
          <MotionConfig reducedMotion="user">
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
            <Celebration />
            {/* useSearchParams needs a Suspense boundary to keep static pages static. */}
            <Suspense fallback={null}>
              <EarnedPointsToast />
            </Suspense>
          </MotionConfig>
        </NuqsAdapter>
      </QueryClientProvider>
    </SessionProvider>
  );
}
