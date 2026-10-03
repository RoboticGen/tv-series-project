"use client";

import * as React from "react";
import { FolderPlus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createCollection,
  getCollectionsForProject,
  toggleProjectInCollection,
} from "@/actions/collections";

interface AddToCollectionButtonProps {
  projectId: string;
  signedIn: boolean;
}

interface CollectionOption {
  id: string;
  title: string;
  containsProject: boolean;
}

export function AddToCollectionButton({ projectId, signedIn }: AddToCollectionButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [collections, setCollections] = React.useState<CollectionOption[]>([]);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState("");
  const [newIsPrivate, setNewIsPrivate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadCollections() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCollectionsForProject(projectId);
      setCollections(data);
    } catch {
      setError("Couldn't load your collections");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) void loadCollections();
  }

  async function handleToggle(collectionId: string) {
    setPendingId(collectionId);
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId ? { ...c, containsProject: !c.containsProject } : c,
      ),
    );
    try {
      await toggleProjectInCollection(collectionId, projectId);
    } catch {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, containsProject: !c.containsProject } : c,
        ),
      );
      setError("Couldn't update that collection");
    } finally {
      setPendingId(null);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const collection = await createCollection({
        title: newTitle.trim(),
        isPrivate: newIsPrivate,
      });
      await toggleProjectInCollection(collection.id, projectId);
      setCollections((prev) => [
        { id: collection.id, title: newTitle.trim(), containsProject: true },
        ...prev,
      ]);
      setNewTitle("");
      setNewIsPrivate(false);
    } catch {
      setError("Couldn't create that collection");
    } finally {
      setCreating(false);
    }
  }

  if (!signedIn) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button size="sm" variant="outline" className="gap-1.5" />}
      >
        <FolderPlus className="size-4" />
        Save to collection
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to collection</DialogTitle>
          <DialogDescription>
            Add this project to one of your collections, or start a new one.
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Spinner className="size-5" />
          </div>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {collections.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                You don&apos;t have any collections yet.
              </p>
            ) : (
              collections.map((collection) => (
                <label
                  key={collection.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    checked={collection.containsProject}
                    disabled={pendingId === collection.id}
                    onCheckedChange={() => handleToggle(collection.id)}
                  />
                  <span className="text-sm">{collection.title}</span>
                </label>
              ))
            )}
          </div>
        )}

        <div className="space-y-2 border-t pt-3">
          <div className="flex gap-2">
            <Input
              placeholder="New collection name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={120}
            />
            <Button size="sm" onClick={handleCreate} disabled={creating || !newTitle.trim()}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
          <label className="flex items-center gap-2">
            <Switch checked={newIsPrivate} onCheckedChange={setNewIsPrivate} size="sm" />
            <span className="text-sm text-muted-foreground">
              Private (only visible to you)
            </span>
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
