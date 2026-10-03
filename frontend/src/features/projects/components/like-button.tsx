"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { toggleLike } from "@/features/projects/actions";

interface LikeButtonProps {
  projectId: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
}

export function LikeButton({
  projectId,
  initialLiked,
  initialCount,
  signedIn,
}: LikeButtonProps) {
  const [confirmed, setConfirmed] = React.useState({ liked: initialLiked, count: initialCount });
  const [{ liked, count }, setOptimistic] = React.useOptimistic(confirmed);
  const [, startTransition] = React.useTransition();

  function handleClick() {
    if (!signedIn) return;
    startTransition(async () => {
      setOptimistic({ liked: !liked, count: count + (liked ? -1 : 1) });
      try {
        const result = await toggleLike(projectId);
        setConfirmed((prev) =>
          prev.liked === result.liked
            ? prev
            : { liked: result.liked, count: prev.count + (result.liked ? 1 : -1) },
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
    >
      <motion.span
        className="flex"
        initial={false}
        animate={{ scale: liked ? [1, 1.6, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart className={cn("size-4", liked && "fill-brand-coral text-edge")} />
      </motion.span>
      {count}
    </Button>
  );
}
