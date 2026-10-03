"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { DURATION } from "@/shared/constants/motion";
import { toggleFollow } from "@/features/follows/actions";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  signedIn: boolean;
}

export function FollowButton({ userId, initialFollowing, signedIn }: FollowButtonProps) {
  const [confirmed, setConfirmed] = React.useState(initialFollowing);
  const [following, setOptimistic] = React.useOptimistic(confirmed);
  const [, startTransition] = React.useTransition();

  function handleClick() {
    if (!signedIn) return;
    startTransition(async () => {
      setOptimistic(!following);
      try {
        const result = await toggleFollow(userId);
        setConfirmed(result.following);
      } catch {}
    });
  }

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      disabled={!signedIn}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={following ? "following" : "follow"}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: DURATION.press }}
          className="inline-flex items-center gap-1.5"
        >
          {following ? <Check className="size-4" aria-hidden /> : null}
          {following ? "Following" : "Follow"}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
