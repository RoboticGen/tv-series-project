"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteProject } from "@/actions/projects";

export function DeleteProjectButton({
  projectId,
  title,
  inModal = false,
}: {
  projectId: string;
  title: string;
  inModal?: boolean;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      if (inModal) {
        // Reuse the panel's own proven "close" mechanism (same as the X
        // button/Escape/backdrop) instead of pushing to an arbitrary URL --
        // Next's parallel-route reconciliation for an intercepted (...)
        // route navigating to an unrelated page is flaky (transient 404
        // until a manual refresh), but closing back to the page that
        // opened it is the well-tested path.
        router.back();
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 className="size-4" />
        Delete project
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{title}&rdquo;?</DialogTitle>
          <DialogDescription>
            This permanently deletes the project, its write-up, images, and
            every submission made against it. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
