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
import { MarkdownEditor } from "@/components/markdown-editor";
import { updateProject, requestPublish } from "@/actions/projects";
import { projectCategory } from "@/db/schema";

const CATEGORY_LABELS: Record<string, string> = {
  robotics: "Robotics",
  electronics: "Electronics",
  iot: "IoT",
  coding_software: "Coding & Software",
  ai_ml: "AI / ML",
  drones: "Drones",
  threed_printing: "3D Printing",
  sensors_automation: "Sensors & Automation",
  competitions: "Competitions",
  other: "Other",
};

interface ProjectFormProps {
  projectId: string;
  initialTitle: string;
  initialSummary: string;
  initialCategory: string;
  initialBody: string;
  status: string;
  rejectionReason: string | null;
}

export function ProjectForm({
  projectId,
  initialTitle,
  initialSummary,
  initialCategory,
  initialBody,
  status,
  rejectionReason,
}: ProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [summary, setSummary] = React.useState(initialSummary);
  const [category, setCategory] = React.useState(initialCategory);
  const [body, setBody] = React.useState(initialBody);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canRequestPublish = status === "draft" || status === "rejected";

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const { slug } = await updateProject(projectId, {
        title,
        summary,
        category,
        body,
      });
      router.push(`/projects/${slug}/edit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRequestPublish() {
    setError(null);
    setIsPublishing(true);
    try {
      await handleSave();
      await requestPublish(projectId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request publish");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {rejectionReason && status === "rejected" ? (
        <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">This project was rejected</p>
            <p className="mt-1">{rejectionReason}</p>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>
            Shown on the browse grid and at the top of your write-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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
          <CardTitle>Write-up</CardTitle>
          <CardDescription>
            The step-by-step build guide, in Markdown. Drag, paste, or use the
            toolbar to add images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            ownerType="project"
            ownerId={projectId}
            placeholder="Write the step-by-step build guide here…"
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur">
        <Button onClick={handleSave} disabled={isSaving || isPublishing} variant="outline">
          {isSaving ? "Saving…" : "Save draft"}
        </Button>
        {canRequestPublish ? (
          <Button onClick={handleRequestPublish} disabled={isSaving || isPublishing}>
            {isPublishing ? "Submitting…" : "Request publish"}
          </Button>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
