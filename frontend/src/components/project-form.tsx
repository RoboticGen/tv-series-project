"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepsEditor } from "@/components/steps-editor";
import { CoverImageUpload } from "@/components/cover-image-upload";
import {
  updateProject,
  publishProject,
  revertProjectToDraft,
  setProjectCoverImage,
} from "@/actions/projects";
import { uploadImage, usePendingImages } from "@/lib/pending-images";
import { projectCategory } from "@/db/schema";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { Step } from "@/lib/steps";

interface ProjectFormProps {
  projectId: string;
  initialTitle: string;
  initialSummary: string;
  initialCategory: string;
  initialCoverImageUrl: string | null;
  initialSteps: Step[];
  status: string;
  rejectionReason: string | null;
  inModal?: boolean;
}

export function ProjectForm({
  projectId,
  initialTitle,
  initialSummary,
  initialCategory,
  initialCoverImageUrl,
  initialSteps,
  status,
  rejectionReason,
  inModal = false,
}: ProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [summary, setSummary] = React.useState(initialSummary);
  const [category, setCategory] = React.useState(initialCategory);
  const [steps, setSteps] = React.useState(initialSteps);
  const pendingImages = usePendingImages();
  // `file` is set while a newly picked cover is only a local preview;
  // `changed` marks a pick or removal that hasn't been saved yet.
  const [cover, setCover] = React.useState<{
    url: string | null;
    file: File | null;
    changed: boolean;
  }>({ url: initialCoverImageUrl, file: null, changed: false });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isUnpublishing, setIsUnpublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canPublish = status === "draft" || status === "rejected";
  const canUnpublish = status === "published";
  const isBusy = isSaving || isPublishing || isUnpublishing;

  // Last-saved values, to hide Save when nothing has changed. Kept in state
  // (not derived from the initial* props) because useState ignores new
  // props after router.refresh().
  const [saved, setSaved] = React.useState(() =>
    JSON.stringify({ title: initialTitle, summary: initialSummary, category: initialCategory, steps: initialSteps }),
  );
  const current = JSON.stringify({ title, summary, category, steps });
  const isDirty = current !== saved || cover.changed;

  function replaceCover(next: { url: string | null; file: File | null }) {
    if (cover.file && cover.url) URL.revokeObjectURL(cover.url);
    setCover({ ...next, changed: true });
  }

  async function saveCover() {
    if (!cover.changed) return;
    if (cover.file) {
      const asset = await uploadImage(cover.file, "project", projectId);
      await setProjectCoverImage(projectId, asset.id);
      if (cover.url) URL.revokeObjectURL(cover.url);
      setCover({ url: asset.url, file: null, changed: false });
    } else {
      await setProjectCoverImage(projectId, null);
      setCover({ url: null, file: null, changed: false });
    }
  }

  // Returns whether the save succeeded, so publishing never goes ahead
  // on top of a failed save.
  async function handleSave(): Promise<boolean> {
    setError(null);
    setIsSaving(true);
    try {
      const savedSteps = await pendingImages.uploadReferencedInSteps(steps, "project", projectId);
      await saveCover();
      const { slug } = await updateProject(projectId, {
        title,
        summary,
        category,
        steps: savedSteps,
      });
      const savedCurrent = JSON.stringify({ title, summary, category, steps: savedSteps });
      setSteps(savedSteps);
      setSaved(savedCurrent);
      if (inModal) {
        router.replace(`/projects/${slug}/edit`);
      } else {
        router.push(`/projects/${slug}/edit`);
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    setError(null);
    setIsPublishing(true);
    try {
      if (isDirty && !(await handleSave())) return;
      await publishProject(projectId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!window.confirm("Unpublish this project? It will be hidden from others and go back to being a draft.")) {
      return;
    }
    setError(null);
    setIsUnpublishing(true);
    try {
      await revertProjectToDraft(projectId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish");
    } finally {
      setIsUnpublishing(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {rejectionReason && status === "rejected" ? (
        <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">This project was unpublished</p>
            <p className="mt-1">{rejectionReason}</p>
          </div>
        </div>
      ) : null}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>
            Shown on the browse grid and at the top of your write-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Cover image</Label>
            <CoverImageUpload
              url={cover.url}
              onSelect={(file) => replaceCover({ url: URL.createObjectURL(file), file })}
              onRemove={() => replaceCover({ url: null, file: null })}
              disabled={isBusy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Line-Following Rover"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A short summary of what this project is and does."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => value && setCategory(value)}
            >
              <SelectTrigger id="category" className="w-full sm:w-64">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {projectCategory.enumValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Steps</CardTitle>
          <CardDescription>
            Break the build into steps. Each step gets a title, photos, and
            instructions in Markdown. Images upload when you save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StepsEditor
            steps={steps}
            onChange={setSteps}
            onImageAdd={pendingImages.add}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur">
        {isDirty || isSaving ? (
          <Button onClick={handleSave} disabled={isBusy} variant="outline">
            {isSaving ? "Saving…" : canUnpublish ? "Save changes" : "Save draft"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">All changes saved</p>
        )}
        {canPublish ? (
          <Button onClick={handlePublish} disabled={isBusy}>
            {isPublishing ? "Publishing…" : "Publish"}
          </Button>
        ) : null}
        {canUnpublish ? (
          <Button onClick={handleUnpublish} disabled={isBusy} variant="outline">
            {isUnpublishing ? "Unpublishing…" : "Unpublish"}
          </Button>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
