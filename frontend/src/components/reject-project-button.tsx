"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { rejectProject } from "@/actions/review";

export function RejectProjectButton({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  const router = useRouter();
  const [reason, setReason] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleReject() {
    setError(null);
    setIsPending(true);
    try {
      await rejectProject(projectId, reason);
      router.push("/dashboard/review");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject project");
      setIsPending(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" className="gap-1.5" />}>
        <X className="size-4" />
        Reject
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject &ldquo;{title}&rdquo;?</DialogTitle>
          <DialogDescription>
            The author will see this reason and can edit and resubmit.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What needs to change before this can be approved?"
          rows={4}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isPending || reason.trim().length < 5}
          >
            {isPending ? "Rejecting…" : "Reject project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
