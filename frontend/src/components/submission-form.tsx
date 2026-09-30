"use client";

import * as React from "react";
import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MarkdownEditor } from "@/components/markdown-editor";
import { createSubmission } from "@/actions/submissions";

interface SubmissionFormProps {
  projectId: string;
  isAuthor: boolean;
}

export function SubmissionForm({ projectId, isAuthor }: SubmissionFormProps) {
  const [body, setBody] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await createSubmission(projectId, {
        body,
        isPrivate: isAuthor ? !isPublic : true,
      });
    } catch (err) {
      // createSubmission redirects on success, which surfaces here as a
      // thrown control-flow error — let it propagate instead of treating
      // the redirect as a failed submission.
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "Failed to submit");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder="Write about how your build went…"
      />
      {isAuthor ? (
        <label className="flex items-center gap-3 rounded-xl border bg-card/50 p-3 text-sm">
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          <span>
            <span className="font-medium text-foreground">
              {isPublic ? "Public" : "Private"}
            </span>{" "}
            — {isPublic
              ? "anyone can see this on the project page."
              : "only you can see this."}
          </span>
        </label>
      ) : (
        <p className="text-xs text-muted-foreground">
          This submission is private — only you will ever be able to see it.
        </p>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit"}
      </Button>
    </div>
  );
}
