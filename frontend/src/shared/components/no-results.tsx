import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

export function NoResults({
  icon: Icon,
  title,
  description,
  clearHref,
  clearLabel = "Clear filters",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  clearHref?: string;
  clearLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-edge px-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-sm border-2 border-edge bg-brand-teal text-brand-navy shadow-hard-3">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="font-bold text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-pretty text-muted-foreground">{description}</p> : null}
      {clearHref ? (
        <Link
          href={clearHref}
          className="inline-flex items-center gap-1 text-sm font-bold text-teal-ink transition-colors hover:text-teal-ink/80"
        >
          <X className="size-3.5" aria-hidden />
          {clearLabel}
        </Link>
      ) : null}
    </div>
  );
}
