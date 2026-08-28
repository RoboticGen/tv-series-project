"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleStar } from "@/actions/projects";

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
  const [starred, setStarred] = React.useState(initialStarred);
  const [count, setCount] = React.useState(initialCount);
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    if (!signedIn || isPending) return;
    const nextStarred = !starred;
    setStarred(nextStarred);
    setCount((c) => c + (nextStarred ? 1 : -1));
    startTransition(async () => {
      try {
        await toggleStar(projectId);
      } catch {
        setStarred(!nextStarred);
        setCount((c) => c + (nextStarred ? -1 : 1));
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
      title="I'm building this"
    >
      <Star className={cn("size-4 text-brand-yellow", starred && "fill-brand-yellow")} />
      {count}
    </Button>
  );
}
