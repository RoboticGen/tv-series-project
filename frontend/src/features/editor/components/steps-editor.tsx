"use client";

import * as React from "react";
import Image from "next/image";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { Button } from "@/shared/components/ui/button";
import { FieldError } from "@/shared/components/ui/field-error";
import { Input } from "@/shared/components/ui/input";
import { MarkdownEditor } from "@/features/editor/components/markdown-editor";
import { MAX_IMAGES_PER_STEP, MAX_STEPS, newStep, type Step } from "@/lib/models/steps";
import { errorMessage } from "@/shared/lib/error-message";


interface StepsFormValues {
  steps: Step[];
}

interface StepsEditorProps {
  onImageAdd?: (file: File) => string;
}

export function StepsEditor({ onImageAdd }: StepsEditorProps) {
  const {
    control,
    register,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext<StepsFormValues>();

  const { fields, append, remove, swap } = useFieldArray({ control, name: "steps", keyName: "key" });
  const [pendingRemoveIndex, setPendingRemoveIndex] = React.useState<number | null>(null);
  const listError = errors.steps?.root?.message ?? errors.steps?.message;


  function recheck() {
    if (listError) void trigger("steps");
  }

  function removeStep(index: number) {
    const step = getValues(`steps.${index}`);
    const hasContent = step.title || step.body || step.images.length > 0;
    if (hasContent) setPendingRemoveIndex(index);
    else remove(index);
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={pendingRemoveIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveIndex(null);
        }}
        title="Delete this step?"
        description="The step and everything written in it will be removed."
        confirmLabel="Delete step"
        destructive
        onConfirm={() => {
          if (pendingRemoveIndex !== null) remove(pendingRemoveIndex);
        }}
      />
      {fields.map((field, index) => {
        const titleError = errors.steps?.[index]?.title?.message;
        return (
          <section key={field.key} className="rounded-xl border bg-card/50">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <span className="shrink-0 font-heading text-sm font-semibold text-teal-ink">
                Step {index + 1}
              </span>
              <Input
                {...register(`steps.${index}.title`, { onChange: recheck })}
                placeholder="Step title, e.g. Gather the parts"
                aria-label={`Step ${index + 1} title`}
                aria-invalid={Boolean(titleError)}
                className="h-8"
              />
              <div className="flex shrink-0 items-center">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => swap(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move step up"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => swap(index, index + 1)}
                  disabled={index === fields.length - 1}
                  aria-label="Move step down"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => removeStep(index)}
                  disabled={fields.length === 1}
                  aria-label="Delete step"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <FieldError>{titleError}</FieldError>
              {onImageAdd ? (
                <Controller
                  control={control}
                  name={`steps.${index}.images`}
                  render={({ field: images }) => (
                    <StepImages images={images.value} onChange={images.onChange} onImageAdd={onImageAdd} />
                  )}
                />
              ) : null}
              <Controller
                control={control}
                name={`steps.${index}.body`}
                render={({ field: body }) => (
                  <MarkdownEditor
                    value={body.value}
                    onChange={(value) => {
                      body.onChange(value);
                      recheck();
                    }}
                    onImageAdd={onImageAdd}
                    placeholder="Describe what to do in this step…"
                  />
                )}
              />
            </div>
          </section>
        );
      })}

      <FieldError>{listError}</FieldError>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => append(newStep())}
        disabled={fields.length >= MAX_STEPS}
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
        setError(errorMessage(err, "Couldn't add that image"));
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
            className="flex aspect-4/3 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors hover:border-brand-teal hover:text-teal-ink disabled:opacity-50"
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
