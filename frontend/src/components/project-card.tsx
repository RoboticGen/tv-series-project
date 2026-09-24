import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ImageOff } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const CATEGORY_LABELS: Record<string, string> = {
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
  isFeatured?: boolean;
  href?: string;
  coverImageUrl?: string | null;
}

export function ProjectCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden rounded-lg border-2 border-brand-navy bg-card py-4 dark:border-white">
      <div className="aspect-video w-full animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 px-4">
        <div className="h-5 w-20 animate-pulse rounded-sm bg-muted" />
        <div className="mt-1 h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-auto flex items-center justify-between border-t-2 border-brand-navy bg-muted/50 px-4 pt-4 dark:border-white">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
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
  isFeatured,
  href,
  coverImageUrl,
}: ProjectCardProps) {
  return (
    <Link href={href ?? `/projects/${slug}`} className="block h-full">
      <Card className="h-full pt-0 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--brand-navy)] dark:hover:shadow-[6px_6px_0_0_#fff]">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-[calc(var(--radius-lg)-2px)] border-b-2 border-brand-navy bg-muted dark:border-white">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
        </div>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              {CATEGORY_LABELS[category] ?? category}
            </Badge>
            {isFeatured ? (
              <Badge className="w-fit bg-brand-yellow text-brand-navy">Featured</Badge>
            ) : null}
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
        <CardFooter className="mt-auto justify-between">
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
