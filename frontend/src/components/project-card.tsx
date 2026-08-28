import Link from "next/link";
import { Heart, Star } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<string, string> = {
  robotics: "Robotics",
  electronics: "Electronics",
  iot: "IoT",
  coding_software: "Coding & Software",
  ai_ml: "AI / ML",
  drones: "Drones",
  threed_printing: "3D Printing",
  sensors_automation: "Sensors & Automation",
  competitions: "Competitions",
  other: "Other",
};

interface ProjectCardProps {
  slug: string;
  title: string;
  summary: string;
  category: string;
  authorName: string;
  likeCount: number;
  starCount: number;
  statusBadge?: string;
  href?: string;
}

export function ProjectCard({
  slug,
  title,
  summary,
  category,
  authorName,
  likeCount,
  starCount,
  statusBadge,
  href,
}: ProjectCardProps) {
  return (
    <Link href={href ?? `/projects/${slug}`}>
      <Card className="h-full transition-colors hover:border-brand-teal">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              {CATEGORY_LABELS[category] ?? category}
            </Badge>
            {statusBadge ? (
              <Badge variant="outline" className="w-fit capitalize">
                {statusBadge}
              </Badge>
            ) : null}
          </div>
          <CardTitle className="mt-1">{title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {summary ? summary : <em>This project has no description</em>}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-between">
          <span className="text-sm text-muted-foreground">by {authorName}</span>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="size-4 text-brand-coral" />
              {likeCount}
            </span>
            <span className="flex items-center gap-1">
              <Star className="size-4 text-brand-yellow" />
              {starCount}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
