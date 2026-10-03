import * as React from "react";
import { uploadMediaAsset } from "@/features/editor/actions";
import type { Step } from "@/lib/models/steps";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "@/features/editor/image-rules";

type OwnerType = "project" | "submission";

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
