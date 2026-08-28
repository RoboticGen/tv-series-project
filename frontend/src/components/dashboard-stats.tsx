import type { LucideIcon } from "lucide-react";
import {
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  Heart,
  Star,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  draftProjects: number;
  pendingProjects: number;
  publishedProjects: number;
  rejectedProjects: number;
  totalLikesReceived: number;
  totalStarsReceived: number;
  submissionsCount: number;
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card className="gap-3 p-4">
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full",
          tone,
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-brand-navy dark:text-white">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

export function DashboardStats(stats: DashboardStatsProps) {
  const tiles = [
    {
      label: "Drafts",
      value: stats.draftProjects,
      icon: FileEdit,
      tone: "bg-brand-grey/15 text-brand-grey",
    },
    {
      label: "Pending review",
      value: stats.pendingProjects,
      icon: Clock,
      tone: "bg-brand-yellow/20 text-brand-navy",
    },
    {
      label: "Published",
      value: stats.publishedProjects,
      icon: CheckCircle2,
      tone: "bg-brand-green/15 text-brand-green",
    },
    {
      label: "Rejected",
      value: stats.rejectedProjects,
      icon: XCircle,
      tone: "bg-destructive/10 text-destructive",
    },
    {
      label: "Likes received",
      value: stats.totalLikesReceived,
      icon: Heart,
      tone: "bg-brand-coral/15 text-brand-coral",
    },
    {
      label: "Stars received",
      value: stats.totalStarsReceived,
      icon: Star,
      tone: "bg-brand-yellow/20 text-brand-navy",
    },
    {
      label: "Submissions",
      value: stats.submissionsCount,
      icon: Upload,
      tone: "bg-brand-sky/15 text-brand-sky",
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
