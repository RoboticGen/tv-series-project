import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Hammer, Sparkles, Star, Trophy } from "lucide-react";
import type { RecentPointEvent } from "@/actions/points";
import { cn } from "@/lib/utils";

const REASONS: Record<
  RecentPointEvent["reason"],
  { icon: LucideIcon; fill: string; describe: (e: RecentPointEvent) => string }
> = {
  submission_created: {
    icon: Hammer,
    fill: "bg-brand-green",
    describe: () => "You tried a build of",
  },
  project_featured: {
    icon: Sparkles,
    fill: "bg-brand-yellow",
    describe: () => "Mentors featured",
  },
  star_received: {
    icon: Star,
    fill: "bg-brand-yellow",
    describe: (e) => `${e.actorName ?? "Someone"} starred`,
  },
};

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(date: Date) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function RecentPoints({ events }: { events: RecentPointEvent[] }) {
  return (
    <section
      aria-labelledby="recent-points-heading"
      className="rounded-xl border-2 border-brand-navy bg-card p-4 shadow-[4px_4px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[4px_4px_0_0_#fff]"
    >
      <h2
        id="recent-points-heading"
        className="text-xs font-black tracking-wide text-muted-foreground uppercase"
      >
        Recent points
      </h2>

      {events.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Trophy className="size-4 shrink-0 text-brand-yellow" aria-hidden />
          No points yet. Try a featured build to earn your first ones!
        </p>
      ) : (
        // Fixed max height (about 3 rows) so a growing list scrolls instead of
        // stretching the progress row and the level card beside it.
        // Focusable so keyboard users can scroll it too.
        <ul
          tabIndex={0}
          aria-label="Recent points"
          className="mt-3 flex max-h-44 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
        >
          {events.map((event) => {
            const { icon: Icon, fill, describe } = REASONS[event.reason];
            return (
              <li key={event.id} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-navy text-brand-navy dark:border-white",
                    fill,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <p className="min-w-0 flex-1 font-medium text-pretty">
                  {describe(event)}{" "}
                  {/* Only link projects that are still live -- a taken-down
                      project's page 404s. */}
                  {event.projectSlug && event.projectStatus === "published" ? (
                    <Link
                      href={`/projects/${event.projectSlug}`}
                      className="font-bold text-foreground underline-offset-2 hover:underline"
                    >
                      {event.projectTitle}
                    </Link>
                  ) : (
                    <span className="font-bold">{event.projectTitle ?? "a project"}</span>
                  )}
                  <span className="block text-xs text-muted-foreground">
                    {timeAgo(event.createdAt)}
                  </span>
                </p>
                <span className="shrink-0 rounded-full border-2 border-brand-navy bg-brand-green/20 px-2 py-0.5 font-sans font-black tabular-nums text-brand-navy dark:border-white dark:text-white">
                  +{event.points}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
