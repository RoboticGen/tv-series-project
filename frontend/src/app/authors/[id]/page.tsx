import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { FolderKanban } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPublishedProjectsByAuthor } from "@/actions/projects";
import { getFollowStatus } from "@/actions/follows";
import { ProjectCard } from "@/components/project-card";
import { Stagger, StaggerItem } from "@/components/reveal";
import { FollowButton } from "@/components/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const viewerId = session?.user?.id;

  const [author] = await db.select().from(users).where(eq(users.id, id));
  if (!author) notFound();

  const [projects, followStatus] = await Promise.all([
    getPublishedProjectsByAuthor(id),
    getFollowStatus(id, viewerId),
  ]);

  const isOwnProfile = viewerId === id;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="overflow-hidden rounded-2xl border bg-linear-to-br from-brand-teal/10 via-transparent to-transparent">
        <div className="flex flex-wrap items-start gap-6 p-6 sm:p-8">
          <Avatar size="lg" className="size-24 shrink-0 border-4 border-background shadow-sm">
            <AvatarImage
              src={author.avatarUrl ?? undefined}
              alt={`${author.displayName}'s avatar`}
            />
            <AvatarFallback className="text-xl">
              {author.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-balance text-2xl font-bold text-brand-navy dark:text-foreground">
              {author.displayName}
            </h1>
            {author.bio ? (
              <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
                {author.bio}
              </p>
            ) : null}
            <div className="mt-4 flex items-center gap-5 text-sm">
              <span>
                <strong className="font-heading text-base text-brand-navy dark:text-foreground">
                  {followStatus.followerCount}
                </strong>{" "}
                <span className="text-muted-foreground">followers</span>
              </span>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <span>
                <strong className="font-heading text-base text-brand-navy dark:text-foreground">
                  {followStatus.followingCount}
                </strong>{" "}
                <span className="text-muted-foreground">following</span>
              </span>
            </div>
          </div>

          {!isOwnProfile ? (
            <FollowButton
              userId={id}
              initialFollowing={followStatus.viewerIsFollowing}
              signedIn={Boolean(viewerId)}
            />
          ) : null}
        </div>
      </header>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-foreground">
          Published projects
        </h2>
        {projects.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
              <FolderKanban className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isOwnProfile
                ? "You haven't published any projects yet."
                : `${author.displayName} hasn't published any projects yet.`}
            </p>
            {isOwnProfile ? (
              <Button size="sm" variant="outline" render={<Link href="/dashboard" />}>
                Go to dashboard
              </Button>
            ) : null}
          </div>
        ) : (
          <Stagger className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <StaggerItem key={project.id}>
                <ProjectCard
                  slug={project.slug}
                  title={project.title}
                  summary={project.summary}
                  category={project.category}
                  authorName={author.displayName}
                  likeCount={project.likeCount}
                  starCount={project.starCount}
                  coverImageUrl={project.coverImageUrl}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
