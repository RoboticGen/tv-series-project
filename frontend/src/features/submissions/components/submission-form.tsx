"use client";

import * as React from "react";
import { unstable_rethrow } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { FieldError } from "@/shared/components/ui/field-error";
import { Switch } from "@/shared/components/ui/switch";
import { StepsEditor } from "@/features/editor/components/steps-editor";
import { errorMessage } from "@/shared/lib/error-message";
import { newStep } from "@/lib/models/steps";
import { submissionFormSchema, type SubmissionFormValues } from "@/features/submissions/schemas";
import { createSubmission } from "@/features/submissions/actions";

interface SubmissionFormProps {
  projectId: string;
  isAuthor: boolean;
}

export function SubmissionForm({ projectId, isAuthor }: SubmissionFormProps) {
  const [defaultValues] = React.useState<SubmissionFormValues>(() => ({ steps: [newStep()], isPublic: false }));
  const form = useForm<SubmissionFormValues>({ resolver: zodResolver(submissionFormSchema), defaultValues });
  const [error, setError] = React.useState<string | null>(null);
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ steps, isPublic }) => {
    setError(null);
    try {
      await createSubmission(projectId, { steps, isPrivate: isAuthor ? !isPublic : true });
    } catch (err) {
      unstable_rethrow(err);
      setError(errorMessage(err, "Failed to submit"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormProvider {...form}>
        <StepsEditor />
      </FormProvider>
      {isAuthor ? (
        <Controller
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <label className="flex items-center gap-3 rounded-xl border bg-card/50 p-3 text-sm">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              <span>
                <span className="font-medium text-foreground">{field.value ? "Public" : "Private"}</span> —{" "}
                {field.value ? "anyone can see this on the project page." : "only you can see this."}
              </span>
            </label>
          )}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          This submission is private — only you will ever be able to see it.
        </p>
      )}
      <FieldError>{error}</FieldError>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
