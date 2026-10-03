"use client";

import * as React from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { toast } from "@/shared/components/toast";
import { EARNED_PARAM, TOASTED_POINTS_KEY } from "@/features/gamification/earned-points";

export function EarnedPointsToast() {
  const [earned, setEarned] = useQueryState(EARNED_PARAM, parseAsInteger);

  React.useEffect(() => {
    if (earned === null) return;
    if (earned > 0 && earned <= 1000) {
      toast({ kind: "points", points: earned, title: "Build submitted!", description: "You earned builder points." });
      try {
        const already = Number(localStorage.getItem(TOASTED_POINTS_KEY)) || 0;
        localStorage.setItem(TOASTED_POINTS_KEY, String(already + earned));
      } catch {}
    }
    void setEarned(null, { scroll: false });
  }, [earned, setEarned]);

  return null;
}
