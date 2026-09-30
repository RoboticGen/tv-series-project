import { FeaturedSpotlightSkeleton } from "@/components/featured-spotlight";

export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your dashboard"
      className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6 sm:py-10"
    >
      <div className="h-56 animate-pulse rounded-2xl border-2 border-brand-navy bg-brand-teal/30 dark:border-edge" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="h-52 animate-pulse rounded-xl border-2 border-brand-navy bg-muted dark:border-edge" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border-2 border-brand-navy bg-muted dark:border-edge" />
          ))}
        </div>
      </div>

      <FeaturedSpotlightSkeleton />
    </div>
  );
}
