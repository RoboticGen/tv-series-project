import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Hammer, Sparkles, Star, Trophy } from "lucide-react";
import type { RecentPointEvent } from "@/features/gamification/services/queries";
import { cn } from "@/shared/lib/utils";
import { timeAgo } from "@/shared/lib/format";

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

export function RecentPoints({ events }: { events: RecentPointEvent[] }) {
  return (
    <section
      aria-labelledby="recent-points-heading"
      className="rounded-xl border-2 border-edge bg-card p-4 shadow-hard-4"
    >
      <h2
        id="recent-points-heading"
        className="text-xs font-black tracking-wide text-muted-foreground uppercase"
      >
        Recent points
      </h2>

      {events.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Trophy className="size-4 shrink-0 fill-brand-yellow text-edge" aria-hidden />
          No points yet. Try a featured build to earn your first ones!
        </p>
      ) : (
        // Only the latest 3 (getMyPoints' default), so the card stays the
        // same height as the level card beside it without scrolling.
        <ul aria-label="Recent points" className="mt-3 flex flex-col gap-2">
          {events.map((event) => {
            const { icon: Icon, fill, describe } = REASONS[event.reason];
            return (
              <li key={event.id} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-edge text-brand-navy",
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
                <span className="shrink-0 rounded-full border-2 border-edge bg-brand-green/20 px-2 py-0.5 font-sans font-black tabular-nums text-foreground">
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
