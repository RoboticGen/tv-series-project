"use client";

import * as React from "react";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { uploadMediaAsset } from "@/actions/media";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  ownerType: "project" | "submission";
  ownerId: string | null;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  ownerType,
  ownerId,
  placeholder,
}: MarkdownEditorProps) {
  const canUploadImages = ownerId !== null;
  const [colorMode, setColorMode] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const isDark =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    // One-time read of the browser's current theme to sync the editor's
    // data-color-mode -- there's no toggle/store to subscribe to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColorMode(isDark ? "dark" : "light");
  }, []);

  async function handleUploadImage(file: File) {
    if (!ownerId) return;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("ownerType", ownerType);
    formData.set("ownerId", ownerId);
    const { url } = await uploadMediaAsset(formData);
    onChange(`${value}\n\n![${file.name}](${url})\n`);
  }

  return (
    <div data-color-mode={colorMode} className="rounded-lg border">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={420}
        preview="live"
        textareaProps={{ placeholder }}
        onPaste={
          canUploadImages
            ? (event) => {
                const file = Array.from(event.clipboardData?.files ?? [])[0];
                if (file?.type.startsWith("image/")) {
                  event.preventDefault();
                  void handleUploadImage(file);
                }
              }
            : undefined
        }
        onDrop={
          canUploadImages
            ? (event) => {
                const file = Array.from(event.dataTransfer?.files ?? [])[0];
                if (file?.type.startsWith("image/")) {
                  event.preventDefault();
                  void handleUploadImage(file);
                }
              }
            : undefined
        }
      />
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          {canUploadImages
            ? "Markdown supported. Drag & drop or paste an image to upload it."
            : "Markdown supported. Save once to enable image uploads."}
        </span>
        {canUploadImages ? (
          <label className="cursor-pointer text-primary hover:underline">
            Upload image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUploadImage(file);
                event.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
