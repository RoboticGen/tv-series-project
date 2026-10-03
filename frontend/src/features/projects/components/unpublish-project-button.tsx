"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { unpublishProject } from "@/features/review/actions";
import { errorMessage } from "@/shared/lib/error-message";

export function UnpublishProjectButton({
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

  async function handleUnpublish() {
    setError(null);
    setIsPending(true);
    try {
      await unpublishProject(projectId, reason);
      router.push("/dashboard/review");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Failed to unpublish project"));
      setIsPending(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" className="gap-1.5" />}>
        <X className="size-4" />
        Unpublish
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unpublish &ldquo;{title}&rdquo;?</DialogTitle>
          <DialogDescription>
            This takes it out of the public browse feed. The author will see this
            reason and can edit and republish.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this being taken down?"
          rows={4}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            onClick={handleUnpublish}
            disabled={isPending || reason.trim().length < 5}
          >
            {isPending ? "Unpublishing…" : "Unpublish project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
