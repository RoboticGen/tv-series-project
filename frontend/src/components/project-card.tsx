import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ImageOff, Sparkles } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/categories";

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
      <Card
        className={cn(
          "h-full pt-0 motion-safe:transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--brand-navy)] dark:hover:shadow-[6px_6px_0_0_#fff]",
          isFeatured && "bg-brand-yellow/10 dark:bg-brand-yellow/5",
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-t-[calc(var(--radius-lg)-2px)] border-b-2 border-brand-navy bg-muted dark:border-white">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-6" aria-hidden />
            </div>
          )}
          {isFeatured ? (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-sm border-2 border-brand-navy bg-brand-yellow px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase shadow-[2px_2px_0_0_var(--brand-navy)]">
              <Sparkles className="size-3.5" aria-hidden />
              Featured
            </span>
          ) : null}
        </div>
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
        <CardFooter className="mt-auto justify-between">
          <span className="text-sm text-muted-foreground">by {authorName}</span>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="size-4 text-brand-coral" aria-hidden />
              <span className="sr-only">Likes:</span>
              {likeCount}
            </span>
            <span className="flex items-center gap-1">
              <Star className="size-4 text-brand-yellow" aria-hidden />
              <span className="sr-only">Stars:</span>
              {starCount}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
