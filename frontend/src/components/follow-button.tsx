"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/actions/follows";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  signedIn: boolean;
}

export function FollowButton({ userId, initialFollowing, signedIn }: FollowButtonProps) {
  const [following, setFollowing] = React.useState(initialFollowing);
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    if (!signedIn || isPending) return;
    const nextFollowing = !following;
    setFollowing(nextFollowing);
    startTransition(async () => {
      try {
        await toggleFollow(userId);
      } catch {
        setFollowing(!nextFollowing);
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      disabled={!signedIn}
      onClick={handleClick}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
