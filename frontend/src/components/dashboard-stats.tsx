import type { LucideIcon } from "lucide-react";
import { Rocket, Sparkles, Heart, Star, Hammer } from "lucide-react";
import { CountUp } from "@/components/reveal";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  publishedProjects: number;
  featuredProjects: number;
  totalLikesReceived: number;
  totalStarsReceived: number;
  submissionsCount: number;
}

export function StatTile({
  label,
  value,
  icon: Icon,
  fill,
  iconFill,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  fill: string;
  iconFill: string;
}) {
  return (
    <li
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border-2 border-brand-navy p-4 shadow-[4px_4px_0_0_var(--brand-navy)] motion-safe:transition-transform hover:-translate-y-1 dark:border-edge dark:shadow-[4px_4px_0_0_var(--edge)]",
        fill,
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-navy text-brand-navy dark:border-edge",
          iconFill,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="w-full min-w-0">
        <p className="font-heading text-3xl leading-none font-black tabular-nums lining-nums text-brand-navy dark:text-foreground">
          <CountUp value={value} />
        </p>
        <p className="mt-1 text-xs leading-tight font-bold tracking-wide text-balance break-words text-brand-navy/75 uppercase dark:text-foreground/75">
          {label}
        </p>
      </div>
    </li>
  );
}

export function DashboardStats(stats: DashboardStatsProps) {
  const tiles = [
    {
      label: "Projects shared",
      value: stats.publishedProjects,
      icon: Rocket,
      fill: "bg-brand-sky/20",
      iconFill: "bg-brand-sky",
    },
    {
      label: "Featured",
      value: stats.featuredProjects,
      icon: Sparkles,
      fill: "bg-brand-yellow/30",
      iconFill: "bg-brand-yellow",
    },
    {
      label: "Likes",
      value: stats.totalLikesReceived,
      icon: Heart,
      fill: "bg-brand-coral/20",
      iconFill: "bg-brand-coral",
    },
    {
      label: "Stars",
      value: stats.totalStarsReceived,
      icon: Star,
      fill: "bg-brand-yellow/20",
      iconFill: "bg-brand-yellow",
    },
    {
      label: "Builds tried",
      value: stats.submissionsCount,
      icon: Hammer,
      fill: "bg-brand-green/20",
      iconFill: "bg-brand-green",
    },
  ];

  return (
    <ul aria-label="Your stats" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </ul>
  );
}
