"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assertUploadableImage } from "@/lib/pending-images";

// Controlled by ProjectForm: picking or removing a cover only changes the
// local preview -- the upload to S3 and the project update happen when the
// form is saved.
interface CoverImageUploadProps {
  url: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function CoverImageUpload({ url, onSelect, onRemove, disabled = false }: CoverImageUploadProps) {
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    try {
      assertUploadableImage(file);
      onSelect(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't use that image");
    }
  }

  function handleRemove() {
    setError(null);
    onRemove();
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
              disabled={disabled}
            >
              Replace
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-brand-teal hover:text-teal-ink disabled:opacity-50"
        >
          <ImagePlus className="size-6" />
          Add a cover image
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
