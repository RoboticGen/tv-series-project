"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/actions/projects";

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
  const [liked, setLiked] = React.useState(initialLiked);
  const [count, setCount] = React.useState(initialCount);
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    if (!signedIn || isPending) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    startTransition(async () => {
      try {
        await toggleLike(projectId);
      } catch {
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
      }
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
      <Heart className={cn("size-4 text-brand-coral", liked && "fill-brand-coral")} />
      {count}
    </Button>
  );
}
