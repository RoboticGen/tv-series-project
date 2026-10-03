"use client";

import { Button } from "@/shared/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 text-center">
      <h2 className="font-heading text-xl font-bold text-foreground">
        Couldn&apos;t load the review queue
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
