"use client";

import { toast as toastManager, type ToastData } from "@/components/ui/toast";

type ToastKind = "success" | "info" | "error" | "points";

export function toast(input: {
  kind?: ToastKind;
  title: string;
  description?: string;
  points?: number;
  href?: string;
}) {
  const data: ToastData = { points: input.points, href: input.href };
  toastManager.add({
    title: input.title,
    description: input.description,
    type: input.kind ?? "info",
    timeout: 5000,
    data,
  });
}
