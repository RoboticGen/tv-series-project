"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { toggleStar } from "@/features/projects/actions";

interface StarButtonProps {
  projectId: string;
  initialStarred: boolean;
  initialCount: number;
  signedIn: boolean;
}

export function StarButton({
  projectId,
  initialStarred,
  initialCount,
  signedIn,
}: StarButtonProps) {
  const [confirmed, setConfirmed] = React.useState({ starred: initialStarred, count: initialCount });
  const [{ starred, count }, setOptimistic] = React.useOptimistic(confirmed);
  const [, startTransition] = React.useTransition();

  function handleClick() {
    if (!signedIn) return;
    startTransition(async () => {
      setOptimistic({ starred: !starred, count: count + (starred ? -1 : 1) });
      try {
        const result = await toggleStar(projectId);
        setConfirmed((prev) =>
          prev.starred === result.starred
            ? prev
            : { starred: result.starred, count: prev.count + (result.starred ? 1 : -1) },
        );
      } catch {}
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={!signedIn}
      onClick={handleClick}
      className="gap-1.5"
      title="Save this project"
      aria-label="Favorite / Save this project"
    >
      <motion.span
        className="flex"
        initial={false}
        animate={{ rotate: starred ? 216 : 0, scale: starred ? [1, 1.5, 1] : 1 }}
        transition={{ duration: 0.4 }}
      >
        <Star className={cn("size-4", starred && "fill-brand-yellow text-edge")} />
      </motion.span>
      {count}
    </Button>
  );
}
