import { ProjectCardSkeleton } from "@/components/project-card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12" aria-hidden="true">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="mt-1 h-4 w-80 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-9 w-full max-w-md animate-pulse rounded-md bg-muted" />
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-6 w-20 animate-pulse rounded-sm bg-muted" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
