import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderOpen, Upload, Star, Compass, Boxes } from "lucide-react";
import { auth } from "@/auth";
import { getDashboardStats } from "@/actions/dashboard";
import { getMyProjects, getMyStarredProjects } from "@/actions/projects";
import { getMySubmissions } from "@/actions/submissions";
import { getMyCollections } from "@/actions/collections";
import { DashboardStats } from "@/components/dashboard-stats";
import { NewProjectButton } from "@/components/new-project-button";
import { ProjectCard } from "@/components/project-card";
import { SubmissionCard } from "@/components/submission-card";
import { CollectionCard } from "@/components/collection-card";
import { CreateCollectionButton } from "@/components/create-collection-button";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-md border-2 border-dashed border-brand-navy py-16 text-center dark:border-white">
      <div className="relative flex size-12 items-center justify-center rounded-sm border-2 border-brand-navy bg-brand-teal text-white shadow-[3px_3px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[3px_3px_0_0_#fff]">
        <Icon className="size-5" />
      </div>
      <div className="relative">
        <p className="font-bold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="relative mt-1">{action}</div> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/landing");

  const userId = session.user.id;
  const [stats, myProjects, mySubmissions, starredProjects, myCollections] = await Promise.all([
    getDashboardStats(userId),
    getMyProjects(userId),
    getMySubmissions(userId),
    getMyStarredProjects(userId),
    getMyCollections(userId),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <div className="flex flex-col gap-4 border-b-[3px] border-brand-navy pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-white">
        <div>
          <span className="inline-block rounded-sm border-2 border-brand-navy bg-brand-navy px-2 py-0.5 text-xs font-black tracking-wide text-white uppercase shadow-[2px_2px_0_0_var(--brand-navy)] dark:border-white dark:bg-white dark:text-brand-navy dark:shadow-[2px_2px_0_0_#fff]">
            Dashboard
          </span>
          <h1 className="mt-2 text-balance font-heading text-3xl font-black tracking-tight text-brand-navy dark:text-white">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your projects.
          </p>
        </div>
        <NewProjectButton className="shrink-0" />
      </div>

      <div className="mt-8">
        <DashboardStats {...stats} />
      </div>

      <div className="mt-10">
        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">
              My Projects
              <span className="text-xs tabular-nums opacity-70">
                {myProjects.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="submissions">
              My Submissions
              <span className="text-xs tabular-nums opacity-70">
                {mySubmissions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="starred">
              Favorites
              <span className="text-xs tabular-nums opacity-70">
                {starredProjects.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="collections">
              Collections
              <span className="text-xs tabular-nums opacity-70">
                {myCollections.length}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="mt-6">
            {myProjects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                description="Start a write-up to share what you've built with the community."
                action={<NewProjectButton>Start a project</NewProjectButton>}
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    slug={project.slug}
                    title={project.title}
                    summary={project.summary}
                    category={project.category}
                    authorName={session.user.name ?? "You"}
                    likeCount={project.likeCount}
                    starCount={project.starCount}
                    coverImageUrl={project.coverImageUrl}
                    statusBadge={project.status === "rejected" ? "unpublished" : project.status}
                    href={`/projects/${project.slug}/edit`}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="submissions" className="mt-6">
            {mySubmissions.length === 0 ? (
              <EmptyState
                icon={Upload}
                title="No submissions yet"
                description="Submit a build of someone else's project to show how yours turned out."
                action={
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/projects" />}
                  >
                    Browse projects
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {mySubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    id={submission.id}
                    projectTitle={submission.projectTitle}
                    createdAt={submission.createdAt}
                    isPrivate={submission.isPrivate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="starred" className="mt-6">
            {starredProjects.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No favorites yet"
                description="Star projects you like while browsing to find them here later."
                action={
                  <Button
                    variant="outline"
                    nativeButton={false}
                    className="gap-2"
                    render={<Link href="/projects" />}
                  >
                    <Compass className="size-4" />
                    Browse projects
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {starredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    slug={project.slug}
                    title={project.title}
                    summary={project.summary}
                    category={project.category}
                    authorName={project.authorName}
                    likeCount={project.likeCount}
                    starCount={project.starCount}
                    coverImageUrl={project.coverImageUrl}
                    href={`/projects/${project.slug}`}
                  />
                ))}
              </div>
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
                description="Group projects you want to revisit or share into a themed collection."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    slug={collection.slug}
                    title={collection.title}
                    description={collection.description}
                    itemCount={collection.itemCount}
                    isPrivate={collection.isPrivate}
                    coverImageUrls={collection.coverImageUrls}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
