import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FolderOpen,
  Upload,
  Star,
  Compass,
  Boxes,
  Sparkles,
  PencilLine,
  Wrench,
  Bot,
  Cog,
  Zap,
} from "lucide-react";
import { auth } from "@/auth";
import { getDashboardStats } from "@/actions/dashboard";
import { getMyProjects, getMyStarredProjects } from "@/actions/projects";
import { getMySubmissions } from "@/actions/submissions";
import { getMyCollections } from "@/actions/collections";
import { getMyPoints, getPointValues } from "@/actions/points";
import { BuilderLevel } from "@/components/builder-level";
import { DashboardStats } from "@/components/dashboard-stats";
import { EmptyState } from "@/components/empty-state";
import { RecentPoints } from "@/components/recent-points";
import { FeaturedSpotlight, FeaturedSpotlightSkeleton } from "@/components/featured-spotlight";
import { NewProjectButton } from "@/components/new-project-button";
import { ProjectCard } from "@/components/project-card";
import { Stagger, StaggerItem } from "@/components/reveal";
import { SubmissionCard } from "@/components/submission-card";
import { CollectionCard } from "@/components/collection-card";
import { CreateCollectionButton } from "@/components/create-collection-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "My Dashboard · RoboticGen Projects",
};

const GRID = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

function TabCount({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-brand-navy/10 px-1.5 text-xs tabular-nums dark:bg-foreground/15">
      {value}
    </span>
  );
}

function BrowseButton({ label = "Explore projects" }: { label?: string }) {
  return (
    <Link
      href="/projects"
      className={buttonVariants({ variant: "outline", className: "gap-2" })}
    >
      <Compass className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const [stats, points, pointValues, myProjects, mySubmissions, starredProjects, myCollections] = await Promise.all([
    getDashboardStats(userId),
    getMyPoints(),
    getPointValues(),
    getMyProjects(userId),
    getMySubmissions(userId),
    getMyStarredProjects(userId),
    getMyCollections(userId),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "Builder";
  // Featured work first, so kids see their proudest projects up top.
  const sortedProjects = [...myProjects].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6 sm:py-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border-2 border-brand-navy bg-brand-teal p-6 text-white shadow-[6px_6px_0_0_var(--brand-navy)] sm:p-8 dark:border-edge dark:shadow-[6px_6px_0_0_var(--edge)]">
        {/* Decorative shapes — hidden from assistive tech */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
          <div className="absolute -top-10 -right-10 size-40 rounded-full border-2 border-brand-navy bg-brand-yellow" />
          <div className="absolute right-28 -bottom-8 size-20 rotate-12 rounded-lg border-2 border-brand-navy bg-brand-coral" />
          <div className="absolute top-8 right-44 size-8 rounded-full border-2 border-brand-navy bg-brand-green" />
          <Cog className="absolute top-4 right-6 size-16 text-brand-navy motion-safe:animate-[spin_12s_linear_infinite]" />
          <Bot className="absolute right-8 bottom-4 hidden size-20 text-white/90 md:block" />
          <Zap className="absolute top-1/2 right-56 hidden size-8 text-brand-yellow lg:block" />
        </div>

        <div className="relative max-w-xl">
          <p className="inline-block rounded-sm border-2 border-brand-navy bg-white px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase">
            My workshop
          </p>
          <h1 className="mt-3 font-heading text-3xl font-black tracking-tight text-balance sm:text-4xl">
            Hey {firstName}, ready to build something awesome?
          </h1>
          <p className="mt-2 font-medium text-pretty text-white/90">
            Start a new project, try a featured build, or keep working on your ideas.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <NewProjectButton size="lg" className="bg-brand-yellow text-brand-navy" />
            <Link
              href="#featured"
              className={buttonVariants({ variant: "neutral", size: "lg", className: "gap-2" })}
            >
              <Sparkles className="size-4" aria-hidden />
              Find a build to try
            </Link>
          </div>
        </div>
      </header>

      {/* Progress: level + stats */}
      <section aria-label="Your progress" className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <BuilderLevel points={points.total} pointValues={pointValues} />
        <div className="flex flex-col gap-4">
          {stats.featuredProjects > 0 ? (
            <p className="flex items-center gap-3 rounded-xl border-2 border-brand-navy bg-brand-yellow p-4 font-bold text-brand-navy shadow-[4px_4px_0_0_var(--brand-navy)] dark:border-edge dark:shadow-[4px_4px_0_0_var(--edge)]">
              <Sparkles className="size-6 shrink-0" aria-hidden />
              <span>
                Woohoo! {stats.featuredProjects === 1 ? "One of your projects is" : `${stats.featuredProjects} of your projects are`}{" "}
                featured. Other kids can now build {stats.featuredProjects === 1 ? "it" : "them"} too!
              </span>
            </p>
          ) : null}
          <DashboardStats {...stats} />
          <RecentPoints events={points.recent} />
          {stats.draftProjects > 0 || stats.rejectedProjects > 0 ? (
            <ul className="flex flex-wrap gap-3 text-sm font-bold">
              {stats.draftProjects > 0 ? (
                <li className="flex items-center gap-2 rounded-lg border-2 border-brand-navy bg-card px-3 py-2 dark:border-edge">
                  <PencilLine className="size-4 text-brand-teal" aria-hidden />
                  {stats.draftProjects} {stats.draftProjects === 1 ? "draft" : "drafts"} waiting for you to finish
                </li>
              ) : null}
              {stats.rejectedProjects > 0 ? (
                <li className="flex items-center gap-2 rounded-lg border-2 border-brand-navy bg-brand-coral/15 px-3 py-2 dark:border-edge">
                  <Wrench className="size-4 text-brand-coral" aria-hidden />
                  {stats.rejectedProjects} {stats.rejectedProjects === 1 ? "project needs" : "projects need"} a small fix
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </section>

      {/* Featured projects stream in separately so they never block the page */}
      <Suspense fallback={<FeaturedSpotlightSkeleton />}>
        <FeaturedSpotlight />
      </Suspense>

      {/* The user's own stuff */}
      <section aria-labelledby="my-stuff-heading">
        <h2
          id="my-stuff-heading"
          className="font-heading text-2xl font-black tracking-tight text-brand-navy sm:text-3xl dark:text-foreground"
        >
          My stuff
        </h2>
        <Tabs defaultValue="projects" className="mt-4">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="projects">
              My projects <TabCount value={myProjects.length} />
            </TabsTrigger>
            <TabsTrigger value="submissions">
              Builds I tried <TabCount value={mySubmissions.length} />
            </TabsTrigger>
            <TabsTrigger value="starred">
              Favorites <TabCount value={starredProjects.length} />
            </TabsTrigger>
            <TabsTrigger value="collections">
              Collections <TabCount value={myCollections.length} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-6">
            {sortedProjects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Your first project is waiting!"
                description="Built something cool? Share how you made it so other kids can learn from you."
                action={<NewProjectButton>Start my first project</NewProjectButton>}
              />
            ) : (
              <Stagger as="ul" className={GRID}>
                {sortedProjects.map((project) => (
                  <StaggerItem as="li" key={project.id}>
                    <ProjectCard
                      slug={project.slug}
                      title={project.title}
                      summary={project.summary}
                      category={project.category}
                      authorName={session.user.name ?? "You"}
                      likeCount={project.likeCount}
                      starCount={project.starCount}
                      coverImageUrl={project.coverImageUrl}
                      isFeatured={project.isFeatured}
                      statusBadge={project.status === "rejected" ? "needs a fix" : project.status}
                      href={`/projects/${project.slug}/edit`}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            {mySubmissions.length === 0 ? (
              <EmptyState
                icon={Upload}
                title="No builds tried yet"
                description="Pick a featured project, build it yourself, and show everyone how yours turned out!"
                action={<BrowseButton label="Find a build to try" />}
              />
            ) : (
              <Stagger as="ul" className={GRID}>
                {mySubmissions.map((submission) => (
                  <StaggerItem as="li" key={submission.id}>
                    <SubmissionCard
                      id={submission.id}
                      projectTitle={submission.projectTitle}
                      createdAt={submission.createdAt}
                      isPrivate={submission.isPrivate}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </TabsContent>

          <TabsContent value="starred" className="mt-6">
            {starredProjects.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No favorites yet"
                description="Tap the star on any project you love and it will show up here."
                action={<BrowseButton />}
              />
            ) : (
              <Stagger as="ul" className={GRID}>
                {starredProjects.map((project) => (
                  <StaggerItem as="li" key={project.id}>
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
          </TabsContent>

          <TabsContent value="collections" className="mt-6">
            <div className="mb-4 flex justify-end">
              <CreateCollectionButton />
            </div>
            {myCollections.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="No collections yet"
                description="Make a collection to keep your favorite projects together, like a playlist of builds."
              />
            ) : (
              <Stagger as="ul" className={GRID}>
                {myCollections.map((collection) => (
                  <StaggerItem as="li" key={collection.id}>
                    <CollectionCard
                      slug={collection.slug}
                      title={collection.title}
                      description={collection.description}
                      itemCount={collection.itemCount}
                      isPrivate={collection.isPrivate}
                      coverImageUrls={collection.coverImageUrls}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
