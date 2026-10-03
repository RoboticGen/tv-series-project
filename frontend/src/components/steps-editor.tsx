"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/markdown-editor";
import { MAX_IMAGES_PER_STEP, MAX_STEPS, newStep, type Step } from "@/lib/steps";

interface StepsEditorProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
  // Called for each image added to a step's gallery or body; returns the
  // local blob: preview URL shown until the form saves (see
  // usePendingImages). Omit to disable images.
  onImageAdd?: (file: File) => string;
}

export function StepsEditor({ steps, onChange, onImageAdd }: StepsEditorProps) {
  function updateStep(id: string, patch: Partial<Step>) {
    onChange(steps.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }

  function moveStep(index: number, offset: -1 | 1) {
    const next = [...steps];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  }

  const [pendingRemoveId, setPendingRemoveId] = React.useState<string | null>(null);

  function removeStep(id: string) {
    const step = steps.find((s) => s.id === id);
    const hasContent = step && (step.title || step.body || step.images.length > 0);
    if (hasContent) setPendingRemoveId(id);
    else onChange(steps.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={pendingRemoveId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null);
        }}
        title="Delete this step?"
        description="The step and everything written in it will be removed."
        confirmLabel="Delete step"
        destructive
        onConfirm={() => onChange(steps.filter((s) => s.id !== pendingRemoveId))}
      />
      {steps.map((step, index) => (
        <section key={step.id} className="rounded-xl border bg-card/50">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <span className="shrink-0 font-heading text-sm font-semibold text-brand-teal">
              Step {index + 1}
            </span>
            <Input
              value={step.title}
              onChange={(e) => updateStep(step.id, { title: e.target.value })}
              placeholder="Step title, e.g. Gather the parts"
              aria-label={`Step ${index + 1} title`}
              className="h-8"
            />
            <div className="flex shrink-0 items-center">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => moveStep(index, -1)}
                disabled={index === 0}
                aria-label="Move step up"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => moveStep(index, 1)}
                disabled={index === steps.length - 1}
                aria-label="Move step down"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => removeStep(step.id)}
                disabled={steps.length === 1}
                aria-label="Delete step"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4">
            {onImageAdd ? (
              <StepImages
                images={step.images}
                onChange={(images) => updateStep(step.id, { images })}
                onImageAdd={onImageAdd}
              />
            ) : null}
            <MarkdownEditor
              value={step.body}
              onChange={(body) => updateStep(step.id, { body })}
              onImageAdd={onImageAdd}
              placeholder="Describe what to do in this step…"
            />
          </div>
        </section>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => onChange([...steps, newStep()])}
        disabled={steps.length >= MAX_STEPS}
      >
        <Plus className="size-4" />
        Add step
      </Button>
    </div>
  );
}

interface StepImagesProps {
  images: string[];
  onChange: (images: string[]) => void;
  onImageAdd: (file: File) => string;
}

function StepImages({ images, onChange, onImageAdd }: StepImagesProps) {
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const remaining = MAX_IMAGES_PER_STEP - images.length;

  function handleFiles(files: File[]) {
    setError(null);
    const urls: string[] = [];
    for (const file of files.slice(0, remaining)) {
      try {
        urls.push(onImageAdd(file));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't add that image");
      }
    }
    if (urls.length > 0) onChange([...images, ...urls]);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((url) => (
          <div key={url} className="group relative aspect-4/3 overflow-hidden rounded-lg border">
            <Image src={url} alt="" fill sizes="200px" className="object-cover" unoptimized />
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              onClick={() => onChange(images.filter((u) => u !== url))}
              className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-4/3 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors hover:border-brand-teal hover:text-brand-teal disabled:opacity-50"
          >
            <ImagePlus className="size-5" />
            Add images
          </button>
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) handleFiles(files);
          event.target.value = "";
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
