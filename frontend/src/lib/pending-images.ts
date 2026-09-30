import * as React from "react";
import { uploadMediaAsset } from "@/actions/media";
import type { Step } from "@/lib/steps";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation";

type OwnerType = "project" | "submission";

// Mirrors the server-side checks in actions/media.ts so a bad file is
// rejected when it's picked, not later when the user hits Save.
export function assertUploadableImage(file: File) {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new Error("Only PNG, JPEG, WebP and GIF images are supported");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Images must be ${MAX_IMAGE_BYTES / 1024 / 1024}MB or smaller`);
  }
}

export function uploadImage(file: File, ownerType: OwnerType, ownerId: string) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("ownerType", ownerType);
  formData.set("ownerId", ownerId);
  return uploadMediaAsset(formData);
}

// Images added in the editor stay in the browser as blob: preview URLs
// until the user saves. Only then are the ones still referenced in the
// Markdown uploaded to S3 and their blob: URLs swapped for real media URLs,
// so images that are removed before saving, or a draft that's abandoned,
// never reach the bucket.
export function usePendingImages() {
  const pendingRef = React.useRef(new Map<string, { file: File; uploadedUrl?: string }>());

  React.useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      for (const blobUrl of pending.keys()) URL.revokeObjectURL(blobUrl);
      pending.clear();
    };
  }, []);

  const add = React.useCallback((file: File) => {
    assertUploadableImage(file);
    const blobUrl = URL.createObjectURL(file);
    pendingRef.current.set(blobUrl, { file });
    return blobUrl;
  }, []);

  // The editor keeps showing (and emitting) the blob: URLs after a save,
  // so each upload is remembered and reused on later saves instead of
  // being uploaded again.
  const uploadReferenced = React.useCallback(
    async (markdown: string, ownerType: OwnerType, ownerId: string) => {
      let result = markdown;
      for (const [blobUrl, entry] of pendingRef.current) {
        if (!result.includes(blobUrl)) continue;
        entry.uploadedUrl ??= (await uploadImage(entry.file, ownerType, ownerId)).url;
        result = result.replaceAll(blobUrl, entry.uploadedUrl);
      }
      return result;
    },
    [],
  );

  // Same, across a steps write-up: each step's gallery and Markdown body.
  const uploadReferencedInSteps = React.useCallback(
    async (steps: Step[], ownerType: OwnerType, ownerId: string) => {
      const result: Step[] = [];
      for (const step of steps) {
        const images: string[] = [];
        for (const url of step.images) {
          images.push(await uploadReferenced(url, ownerType, ownerId));
        }
        const body = await uploadReferenced(step.body, ownerType, ownerId);
        result.push({ ...step, images, body });
      }
      return result;
    },
    [uploadReferenced],
  );

  return { add, uploadReferenced, uploadReferencedInSteps };
}
