"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/toast";
import { EARNED_PARAM, TOASTED_POINTS_KEY } from "@/lib/earned-points";

export function EarnedPointsToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const earned = Number(searchParams.get(EARNED_PARAM));

  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!Number.isInteger(earned) || earned <= 0 || earned > 1000) {
      handled.current = false;
      return;
    }
    if (handled.current) return;
    handled.current = true;
    toast({ kind: "points", points: earned, title: "Build submitted!", description: "You earned builder points." });
    try {
      const already = Number(localStorage.getItem(TOASTED_POINTS_KEY)) || 0;
      localStorage.setItem(TOASTED_POINTS_KEY, String(already + earned));
    } catch {}

    const rest = new URLSearchParams(searchParams);
    rest.delete(EARNED_PARAM);
    router.replace(rest.size > 0 ? `${pathname}?${rest}` : pathname, { scroll: false });
  }, [earned, pathname, router, searchParams]);

  return null;
}
