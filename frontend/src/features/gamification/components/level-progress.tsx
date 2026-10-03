"use client";

import * as React from "react";
import { motion } from "motion/react";
import { celebrate } from "@/features/gamification/components/celebration";
import { toast } from "@/shared/components/toast";
import { TOASTED_POINTS_KEY } from "@/features/gamification/earned-points";
import { EASE_SNAP } from "@/shared/constants/motion";

const STORAGE_KEY = "rg:last-seen-points";

// The builder-level bar.
export function LevelProgress({
  points,
  progress,
  levelName,
  levelMinPoints,
  label,
}: {
  points: number;
  progress: number;
  levelName: string;
  levelMinPoints: number;
  label: string;
}) {
  React.useEffect(() => {
    let previous: number | null = null;
    let alreadyToasted = 0;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      previous = stored === null ? null : Number(stored);
      alreadyToasted = Number(localStorage.getItem(TOASTED_POINTS_KEY)) || 0;
      localStorage.setItem(STORAGE_KEY, String(points));
      localStorage.removeItem(TOASTED_POINTS_KEY);
    } catch {
      return;
    }
    if (previous === null || !Number.isFinite(previous) || points <= previous) return;

    const unannounced = points - previous - alreadyToasted;
    if (previous < levelMinPoints) {
      celebrate({ title: `${levelName}!`, subtitle: "You reached a new builder level" });
    } else if (unannounced > 0) {
      toast({ kind: "points", points: unannounced, title: "New builder points!", description: `You now have ${points}.` });
    }
  }, [points, levelName, levelMinPoints]);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className="relative h-5 w-full overflow-hidden rounded-lg border-2 border-edge bg-background"
    >
      <motion.div
        className="h-full border-r-2 border-edge bg-primary"
        initial={{ width: "0%" }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.9, ease: EASE_SNAP, delay: 0.15 }}
      />
    </div>
  );
}
