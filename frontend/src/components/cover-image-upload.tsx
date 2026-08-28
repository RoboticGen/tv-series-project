"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadMediaAsset } from "@/actions/media";
import { setProjectCoverImage } from "@/actions/projects";

interface CoverImageUploadProps {
  projectId: string;
  initialUrl: string | null;
}

export function CoverImageUpload({ projectId, initialUrl }: CoverImageUploadProps) {
  const [url, setUrl] = React.useState(initialUrl);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("ownerType", "project");
      formData.set("ownerId", projectId);
      const asset = await uploadMediaAsset(formData);
      await setProjectCoverImage(projectId, asset.id);
      setUrl(asset.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover image");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      await setProjectCoverImage(projectId, null);
      setUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove cover image");
    }
  }

  return (
    <div className="space-y-2">
      {url ? (
        <div className="group relative h-48 w-full overflow-hidden rounded-lg border">
          <Image
            src={url}
            alt="Cover image"
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading…" : "Replace"}
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-brand-teal hover:text-brand-teal disabled:opacity-50"
        >
          <ImagePlus className="size-6" />
          {isUploading ? "Uploading…" : "Add a cover image"}
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
