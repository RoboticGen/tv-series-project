"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toggleProjectInCollection } from "@/features/collections/actions";

interface RemoveFromCollectionButtonProps {
  collectionId: string;
  projectId: string;
}

export function RemoveFromCollectionButton({
  collectionId,
  projectId,
}: RemoveFromCollectionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    startTransition(async () => {
      await toggleProjectInCollection(collectionId, projectId);
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="absolute top-2 right-2 z-10 gap-1"
      onClick={handleClick}
      disabled={isPending}
      title="Remove from collection"
      aria-label="Remove from collection"
    >
      <X className="size-3.5" />
      Remove
    </Button>
  );
}
