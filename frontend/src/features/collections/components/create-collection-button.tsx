"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { FieldError } from "@/shared/components/ui/field-error";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
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
import { createCollection } from "@/features/collections/actions";
import { errorMessage } from "@/shared/lib/error-message";
import { cn } from "@/shared/lib/utils";
import { createCollectionSchema, type CollectionFormValues } from "@/features/collections/schemas";

export function CreateCollectionButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: { title: "", description: "", isPrivate: false },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setError(null);
    }
  }

  const onSubmit = handleSubmit(async ({ title, description, isPrivate }) => {
    setError(null);
    try {
      await createCollection({ title, description: description || undefined, isPrivate });
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Failed to create collection"));
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" className={cn("gap-1.5", className)} />}>
        <Plus className="size-4" />
        New collection
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>
              Group projects together under a title people can browse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="collection-title">Title</Label>
              <Input
                id="collection-title"
                placeholder="e.g. Beginner robotics builds"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "collection-title-error" : undefined}
                {...register("title")}
              />
              <FieldError id="collection-title-error">{errors.title?.message}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="collection-description">Description (optional)</Label>
              <Textarea
                id="collection-description"
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "collection-description-error" : undefined}
                {...register("description")}
              />
              <FieldError id="collection-description-error">{errors.description?.message}</FieldError>
            </div>
            <Controller
              control={control}
              name="isPrivate"
              render={({ field }) => (
                <label className="flex items-center gap-2">
                  <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  <span className="text-sm">Private (only visible to you)</span>
                </label>
              )}
            />
          </div>

          <FieldError>{error}</FieldError>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
