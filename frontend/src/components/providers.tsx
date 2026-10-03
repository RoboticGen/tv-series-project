"use client";

import { Suspense } from "react";
import { MotionConfig } from "motion/react";
import { SessionProvider } from "next-auth/react";
import { Celebration } from "@/components/celebration";
import { EarnedPointsToast } from "@/components/earned-points-toast";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}
