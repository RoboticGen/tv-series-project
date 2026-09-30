import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Hammer, Heart, ImageOff, Sparkles, Star } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getFeaturedProjects } from "@/actions/projects";
import { ProjectCard, ProjectCardSkeleton } from "@/components/project-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { CATEGORY_LABELS } from "@/lib/categories";
import { cn } from "@/lib/utils";

const SPOTLIGHT_SIZE = 4;

function SpotlightHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-sm border-2 border-brand-navy bg-brand-yellow px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase shadow-[2px_2px_0_0_var(--brand-navy)] dark:border-edge">
          <Sparkles className="size-3.5" aria-hidden />
          Featured builds
        </span>
        <h2
          id="featured-heading"
          className="mt-2 font-heading text-2xl font-black tracking-tight text-balance text-brand-navy sm:text-3xl dark:text-foreground"
        >
          Pick one and build it too!
        </h2>
        <p className="mt-1 text-sm font-medium text-pretty text-muted-foreground">
          Mentors picked these awesome projects. Follow the steps, then share how yours turned out.
        </p>
      </div>
      <Link
        href="/projects"
        className={buttonVariants({ variant: "outline", className: "shrink-0 gap-2" })}
      >
        See all projects
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

export function FeaturedSpotlightSkeleton({ className }: { className?: string }) {
  return (
    <section id="featured" aria-labelledby="featured-heading" aria-busy="true" className={cn("scroll-mt-6", className)}>
      <SpotlightHeader />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl border-2 border-brand-navy bg-muted lg:col-span-3 dark:border-edge" />
        {Array.from({ length: SPOTLIGHT_SIZE - 1 }, (_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

// Async server component, rendered inside <Suspense> so the rest of the
// dashboard can stream in without waiting on this query.
export async function FeaturedSpotlight({ className }: { className?: string }) {
  const featured = await getFeaturedProjects({ page: 1, pageSize: SPOTLIGHT_SIZE });
  if (featured.length === 0) {
    return (
      <section id="featured" aria-labelledby="featured-heading" className={cn("scroll-mt-6", className)}>
        <SpotlightHeader />
        <div className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="Featured builds are coming soon"
            description="Mentors haven't picked any projects yet. Check back soon, or share yours and it might be the first!"
          />
        </div>
      </section>
    );
  }

  const [lead, ...rest] = featured;

  return (
    <section id="featured" aria-labelledby="featured-heading" className={cn("scroll-mt-6", className)}>
      <SpotlightHeader />

      <div className="mt-6 flex flex-col gap-6">
        <Link
          href={`/projects/${lead.slug}`}
          className="group grid overflow-hidden rounded-xl border-2 border-brand-navy bg-brand-yellow/15 shadow-[6px_6px_0_0_var(--brand-navy)] outline-none motion-safe:transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--brand-navy)] focus-visible:ring-4 focus-visible:ring-ring/60 md:grid-cols-2 dark:border-edge dark:shadow-[6px_6px_0_0_var(--edge)] dark:hover:shadow-[8px_8px_0_0_var(--edge)]"
        >
          <div className="relative aspect-video border-b-2 border-brand-navy bg-muted md:aspect-auto md:min-h-72 md:border-r-2 md:border-b-0 dark:border-edge">
            {lead.coverImageUrl ? (
              <Image
                src={lead.coverImageUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-8" aria-hidden />
              </div>
            )}
            <span className="absolute top-3 left-3 inline-flex -rotate-3 items-center gap-1 rounded-sm border-2 border-brand-navy bg-brand-yellow px-2.5 py-1 text-sm font-black text-brand-navy uppercase shadow-[3px_3px_0_0_var(--brand-navy)]">
              <Sparkles className="size-4" aria-hidden />
              Top pick
            </span>
          </div>
          <div className="flex flex-col gap-3 p-6">
            <Badge variant="secondary">{CATEGORY_LABELS[lead.category] ?? lead.category}</Badge>
            <h3 className="font-heading text-2xl font-black text-balance text-brand-navy sm:text-3xl dark:text-foreground">
              {lead.title}
            </h3>
            <p className="line-clamp-3 font-medium text-pretty text-muted-foreground">
              {lead.summary || "This project has no description yet."}
            </p>
            <p className="text-sm font-bold text-foreground">by {lead.authorName}</p>
            <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
              <span className="inline-flex items-center gap-2 rounded-lg border-2 border-brand-navy bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_0_var(--brand-navy)] motion-safe:transition-all group-hover:translate-x-[3px] group-hover:translate-y-[3px] group-hover:shadow-none dark:border-edge dark:shadow-[3px_3px_0_0_var(--edge)]">
                <Hammer className="size-4" aria-hidden />
                Let&apos;s build it!
              </span>
              <span className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="size-4 text-brand-coral" aria-hidden />
                  <span className="sr-only">Likes:</span>
                  {lead.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-4 text-brand-yellow" aria-hidden />
                  <span className="sr-only">Stars:</span>
                  {lead.starCount}
                </span>
              </span>
            </div>
          </div>
        </Link>

        {rest.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  slug={project.slug}
                  title={project.title}
                  summary={project.summary}
                  category={project.category}
                  authorName={project.authorName}
                  likeCount={project.likeCount}
                  starCount={project.starCount}
                  coverImageUrl={project.coverImageUrl}
                  isFeatured
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
