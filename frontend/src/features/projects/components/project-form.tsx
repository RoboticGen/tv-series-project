"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { FieldError } from "@/shared/components/ui/field-error";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { celebrate } from "@/features/gamification/components/celebration";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { StepsEditor } from "@/features/editor/components/steps-editor";
import { CoverImageUpload } from "@/features/projects/components/cover-image-upload";
import { updateProject, publishProject, revertProjectToDraft, setProjectCoverImage } from "@/features/projects/actions";
import { uploadImage, usePendingImages } from "@/features/editor/hooks/pending-images";
import { projectCategory } from "@/lib/db/schema";
import { CATEGORY_LABELS } from "@/features/projects/categories";
import { errorMessage } from "@/shared/lib/error-message";
import type { Step } from "@/lib/models/steps";
import { projectFormSchema, type ProjectFormValues } from "@/features/projects/schemas";

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
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: initialTitle,
      summary: initialSummary,
      category: initialCategory as ProjectFormValues["category"],
      steps: initialSteps,
    },
  });
  const { control, register, reset, formState } = form;
  const { errors } = formState;
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
  const isDirty = formState.isDirty || cover.changed;

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

  async function save(values: ProjectFormValues): Promise<boolean> {
    setIsSaving(true);
    try {
      const savedSteps = await pendingImages.uploadReferencedInSteps(values.steps, "project", projectId);
      await saveCover();
      const { slug } = await updateProject(projectId, { ...values, steps: savedSteps });
      reset({ ...values, steps: savedSteps });
      if (inModal) {
        router.replace(`/projects/${slug}/edit`);
      } else {
        router.push(`/projects/${slug}/edit`);
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(errorMessage(err, "Failed to save"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function handleSave(): Promise<boolean> {
    setError(null);
    return new Promise((resolve) => {
      void form.handleSubmit(
        async (values) => resolve(await save(values)),
        () => {
          setError("Fix the highlighted fields, then try again.");
          resolve(false);
        },
      )();
    });
  }

  async function handlePublish() {
    setError(null);
    setIsPublishing(true);
    try {
      if (isDirty && !(await handleSave())) return;
      await publishProject(projectId);
      celebrate({ title: "Published!", subtitle: "Your project is live for everyone to see" });
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Failed to publish"));
    } finally {
      setIsPublishing(false);
    }
  }

  const [confirmingUnpublish, setConfirmingUnpublish] = React.useState(false);

  async function handleUnpublish() {
    setError(null);
    setIsUnpublishing(true);
    try {
      await revertProjectToDraft(projectId);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Failed to unpublish"));
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
              placeholder="Line-Following Rover"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              {...register("title")}
            />
            <FieldError id="title-error">{errors.title?.message}</FieldError>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              placeholder="A short summary of what this project is and does."
              rows={3}
              aria-invalid={Boolean(errors.summary)}
              aria-describedby={errors.summary ? "summary-error" : undefined}
              {...register("summary")}
            />
            <FieldError id="summary-error">{errors.summary?.message}</FieldError>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
                  <SelectTrigger id="category" className="w-full sm:w-64" aria-invalid={Boolean(errors.category)}>
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
              )}
            />
            <FieldError>{errors.category?.message}</FieldError>
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
          <FormProvider {...form}>
            <StepsEditor onImageAdd={pendingImages.add} />
          </FormProvider>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur">
        {isDirty || isSaving ? (
          <Button onClick={() => void handleSave()} disabled={isBusy} variant="outline">
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
          <Button onClick={() => setConfirmingUnpublish(true)} disabled={isBusy} variant="outline">
            {isUnpublishing ? "Unpublishing…" : "Unpublish"}
          </Button>
        ) : null}
        <ConfirmDialog
          open={confirmingUnpublish}
          onOpenChange={setConfirmingUnpublish}
          title="Unpublish this project?"
          description="It will be hidden from others and go back to being a draft."
          confirmLabel="Unpublish"
          onConfirm={handleUnpublish}
        />
        {error ? (
          <p key={error} role="alert" className="text-sm text-destructive motion-safe:animate-shake">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
