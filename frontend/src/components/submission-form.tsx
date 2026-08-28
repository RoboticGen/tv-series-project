"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/markdown-editor";
import { createSubmission } from "@/actions/submissions";

interface SubmissionFormProps {
  projectId: string;
}

export function SubmissionForm({ projectId }: SubmissionFormProps) {
  const [body, setBody] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await createSubmission(projectId, { body });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <MarkdownEditor
        value={body}
        onChange={setBody}
        ownerType="submission"
        ownerId={null}
        placeholder="Write about how your build went…"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit"}
      </Button>
      <p className="text-xs text-muted-foreground">
        This submission is private — only you will ever be able to see it.
      </p>
    </div>
  );
}
