"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveProject } from "@/actions/review";

export function ApproveProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    setIsPending(true);
    try {
      await approveProject(projectId);
      router.push("/dashboard/review");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve project");
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button onClick={handleApprove} disabled={isPending} className="gap-1.5">
        <Check className="size-4" />
        {isPending ? "Approving…" : "Approve & feature"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
