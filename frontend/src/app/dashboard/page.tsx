import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardStats } from "@/actions/dashboard";
import { getMyProjects } from "@/actions/projects";
import { getMySubmissions } from "@/actions/submissions";
import { DashboardStats } from "@/components/dashboard-stats";
import { ProjectCard } from "@/components/project-card";
import { SubmissionCard } from "@/components/submission-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/landing");

  const userId = session.user.id;
  const [stats, myProjects, mySubmissions] = await Promise.all([
    getDashboardStats(userId),
    getMyProjects(userId),
    getMySubmissions(userId),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}.
        </p>
      </div>

      <div className="mt-6">
        <DashboardStats {...stats} />
      </div>

      <div className="mt-10">
        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="mt-6">
            {myProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t created a project yet.
              </p>
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
                    statusBadge={project.status.replace("_", " ")}
                    href={`/projects/${project.slug}/edit`}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="submissions" className="mt-6">
            {mySubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t submitted a build yet.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {mySubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    id={submission.id}
                    projectTitle={submission.projectTitle}
                    createdAt={submission.createdAt}
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
