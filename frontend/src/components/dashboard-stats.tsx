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
  wash,
  chip,
  emphasize,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  wash: string;
  chip: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        wash,
        emphasize && "sm:col-span-2",
      )}
    >
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          chip,
        )}
      >
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
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function DashboardStats(stats: DashboardStatsProps) {
  const tiles = [
    {
      label: "Published",
      value: stats.publishedProjects,
      icon: CheckCircle2,
      wash: "bg-brand-green/8 dark:bg-brand-green/12",
      chip: "bg-brand-green/15 text-brand-green",
      emphasize: true,
    },
    {
      label: "Drafts",
      value: stats.draftProjects,
      icon: FileEdit,
      wash: "bg-brand-grey/8 dark:bg-brand-grey/12",
      chip: "bg-brand-grey/15 text-brand-grey",
    },
    {
      label: "Featured",
      value: stats.featuredProjects,
      icon: Sparkles,
      wash: "bg-brand-yellow/10 dark:bg-brand-yellow/12",
      chip: "bg-brand-yellow/20 text-brand-navy dark:text-brand-yellow",
    },
    {
      label: "Unpublished",
      value: stats.rejectedProjects,
      icon: XCircle,
      wash: "bg-destructive/6 dark:bg-destructive/10",
      chip: "bg-destructive/10 text-destructive",
    },
    {
      label: "Likes received",
      value: stats.totalLikesReceived,
      icon: Heart,
      wash: "bg-brand-coral/8 dark:bg-brand-coral/12",
      chip: "bg-brand-coral/15 text-brand-coral",
    },
    {
      label: "Favorites received",
      value: stats.totalStarsReceived,
      icon: Star,
      wash: "bg-brand-yellow/10 dark:bg-brand-yellow/12",
      chip: "bg-brand-yellow/20 text-brand-navy dark:text-brand-yellow",
    },
    {
      label: "Submissions",
      value: stats.submissionsCount,
      icon: Upload,
      wash: "bg-brand-sky/8 dark:bg-brand-sky/12",
      chip: "bg-brand-sky/15 text-brand-sky",
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
