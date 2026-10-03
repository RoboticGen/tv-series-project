"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toggleFeatured } from "@/features/review/actions";
import { errorMessage } from "@/shared/lib/error-message";

export function FeatureProjectButton({
  projectId,
  isFeatured,
}: {
  projectId: string;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    setIsPending(true);
    try {
      await toggleFeatured(projectId);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Failed to update featured state"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        onClick={handleToggle}
        disabled={isPending}
        variant={isFeatured ? "secondary" : "outline"}
        className="gap-1.5"
      >
        <Star className="size-4" />
        {isPending ? "Updating…" : isFeatured ? "Unfeature" : "Feature"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
