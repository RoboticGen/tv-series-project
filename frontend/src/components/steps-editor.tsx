"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/markdown-editor";
import { uploadMediaAsset } from "@/actions/media";
import { MAX_IMAGES_PER_STEP, MAX_STEPS, newStep, type Step } from "@/lib/steps";

interface StepsEditorProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
  ownerType: "project" | "submission";
  // null until the owner row exists (a submission being written for the
  // first time) -- image uploads need an owner to check access against.
  ownerId: string | null;
}

export function StepsEditor({ steps, onChange, ownerType, ownerId }: StepsEditorProps) {
  function updateStep(id: string, patch: Partial<Step>) {
    onChange(steps.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }

  function moveStep(index: number, offset: -1 | 1) {
    const next = [...steps];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  }

  function removeStep(id: string) {
    const step = steps.find((s) => s.id === id);
    const hasContent = step && (step.title || step.body || step.images.length > 0);
    if (hasContent && !window.confirm("Delete this step and its content?")) return;
    onChange(steps.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
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
            {ownerId ? (
              <StepImages
                images={step.images}
                onChange={(images) => updateStep(step.id, { images })}
                ownerType={ownerType}
                ownerId={ownerId}
              />
            ) : null}
            <MarkdownEditor
              value={step.body}
              onChange={(body) => updateStep(step.id, { body })}
              ownerType={ownerType}
              ownerId={ownerId}
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
  ownerType: "project" | "submission";
  ownerId: string;
}

function StepImages({ images, onChange, ownerType, ownerId }: StepImagesProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const remaining = MAX_IMAGES_PER_STEP - images.length;

  async function handleFiles(files: File[]) {
    setError(null);
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, remaining)) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("ownerType", ownerType);
        formData.set("ownerId", ownerId);
        const { url } = await uploadMediaAsset(formData);
        urls.push(url);
      }
      onChange([...images, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
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
            disabled={isUploading}
            className="flex aspect-4/3 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors hover:border-brand-teal hover:text-brand-teal disabled:opacity-50"
          >
            <ImagePlus className="size-5" />
            {isUploading ? "Uploading…" : "Add images"}
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
          if (files.length > 0) void handleFiles(files);
          event.target.value = "";
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
