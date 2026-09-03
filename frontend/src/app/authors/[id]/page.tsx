import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPublishedProjectsByAuthor } from "@/actions/projects";
import { getFollowStatus } from "@/actions/follows";
import { ProjectCard } from "@/components/project-card";
import { FollowButton } from "@/components/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <div className="flex flex-wrap items-start gap-6">
        <Avatar size="lg" className="size-20">
          <AvatarImage src={author.avatarUrl ?? undefined} alt={author.displayName} />
          <AvatarFallback className="text-lg">
            {author.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
            {author.displayName}
          </h1>
          {author.bio ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{author.bio}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{followStatus.followerCount}</strong> followers
            </span>
            <span>
              <strong className="text-foreground">{followStatus.followingCount}</strong> following
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

      <div className="mt-10">
        <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white">
          Published projects
        </h2>
        {projects.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No published projects yet.</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                slug={project.slug}
                title={project.title}
                summary={project.summary}
                category={project.category}
                authorName={author.displayName}
                likeCount={project.likeCount}
                starCount={project.starCount}
                coverImageUrl={project.coverImageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
