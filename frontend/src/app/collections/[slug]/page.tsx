import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, FolderOpen, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { getCollectionBySlug } from "@/actions/collections";
import { ProjectCard } from "@/components/project-card";
import { Stagger, StaggerItem } from "@/components/reveal";
import { RemoveFromCollectionButton } from "@/components/remove-from-collection-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection not found" };
  return {
    title: `${collection.title} — RoboticGen Collections`,
    description: collection.description || `A collection by ${collection.ownerName}.`,
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const viewerId = session?.user?.id;

  const collection = await getCollectionBySlug(slug, viewerId);
  if (!collection) notFound();

  const isOwner = viewerId === collection.ownerId;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href={`/authors/${collection.ownerId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-teal-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to {collection.ownerName}&rsquo;s profile
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        {collection.isPrivate ? (
          <Badge variant="outline" className="w-fit gap-1">
            <Lock className="size-3" />
            Private
          </Badge>
        ) : null}
      </div>

      <h1 className="mt-2 font-heading text-balance text-2xl font-bold text-foreground">
        {collection.title}
      </h1>
      {collection.description ? (
        <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
          {collection.description}
        </p>
      ) : null}
      <p className="mt-3 text-sm text-muted-foreground">
        By{" "}
        <Link
          href={`/authors/${collection.ownerId}`}
          className="underline underline-offset-2 transition-colors hover:text-teal-ink"
        >
          {collection.ownerName}
        </Link>{" "}
        &middot; {collection.itemCount} {collection.itemCount === 1 ? "project" : "projects"}
      </p>

      <div className="mt-10">
        {collection.projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-teal/10 text-teal-ink">
              <FolderOpen className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isOwner
                ? "You haven't added any projects to this collection yet."
                : "This collection doesn't have any projects yet."}
            </p>
            {isOwner ? (
              <Button size="sm" variant="outline" render={<Link href="/projects" />}>
                Browse projects
              </Button>
            ) : null}
          </div>
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collection.projects.map((project) => (
              <StaggerItem key={project.id} className="relative">
                {isOwner ? (
                  <RemoveFromCollectionButton
                    collectionId={collection.id}
                    projectId={project.id}
                  />
                ) : null}
                <ProjectCard
                  slug={project.slug}
                  title={project.title}
                  summary={project.summary}
                  category={project.category}
                  authorName={project.authorName}
                  likeCount={project.likeCount}
                  starCount={project.starCount}
                  coverImageUrl={project.coverImageUrl}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
