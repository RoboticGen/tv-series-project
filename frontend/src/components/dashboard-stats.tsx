import type { LucideIcon } from "lucide-react";
import {
  FileEdit,
  CheckCircle2,
  Sparkles,
  XCircle,
  Heart,
  Star,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  draftProjects: number;
  publishedProjects: number;
  featuredProjects: number;
  rejectedProjects: number;
  totalLikesReceived: number;
  totalStarsReceived: number;
  submissionsCount: number;
}

function StatTile({
  label,
  value,
  icon: Icon,
  fill,
  emphasize,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  fill: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border-2 border-brand-navy p-4 shadow-[4px_4px_0_0_var(--brand-navy)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[4px_4px_0_0_#fff] dark:hover:shadow-[6px_6px_0_0_#fff]",
        fill,
        emphasize && "sm:col-span-2",
      )}
    >
      <div className="flex size-8 items-center justify-center rounded-sm border-2 border-brand-navy bg-white text-brand-navy dark:border-white dark:bg-black dark:text-white">
        <Icon className="size-4" />
      </div>
      <p
        className={cn(
          "mt-3 font-bold tabular-nums text-brand-navy dark:text-white",
          emphasize ? "text-3xl" : "text-2xl",
        )}
      >
        {value}
      </p>
      <p className="text-xs font-bold tracking-wide text-brand-navy/70 uppercase dark:text-white/70">
        {label}
      </p>
    </div>
  );
}

export function DashboardStats(stats: DashboardStatsProps) {
  const tiles = [
    {
      label: "Published",
      value: stats.publishedProjects,
      icon: CheckCircle2,
      fill: "bg-brand-green/25",
      emphasize: true,
    },
    {
      label: "Drafts",
      value: stats.draftProjects,
      icon: FileEdit,
      fill: "bg-brand-grey/25",
    },
    {
      label: "Featured",
      value: stats.featuredProjects,
      icon: Sparkles,
      fill: "bg-brand-yellow/35",
    },
    {
      label: "Unpublished",
      value: stats.rejectedProjects,
      icon: XCircle,
      fill: "bg-destructive/20",
    },
    {
      label: "Likes received",
      value: stats.totalLikesReceived,
      icon: Heart,
      fill: "bg-brand-coral/25",
    },
    {
      label: "Favorites received",
      value: stats.totalStarsReceived,
      icon: Star,
      fill: "bg-brand-yellow/35",
    },
    {
      label: "Submissions",
      value: stats.submissionsCount,
      icon: Upload,
      fill: "bg-brand-sky/25",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </div>
  );
}
