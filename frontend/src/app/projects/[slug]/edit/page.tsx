import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getContentDoc } from "@/db/content";
import { ProjectForm } from "@/components/project-form";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "secondary" | "outline"> = {
  draft: "outline",
  pending_review: "secondary",
  rejected: "outline",
  published: "secondary",
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/landing");

  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  if (project.authorId !== session.user.id) notFound();

  const body = (await getContentDoc(project.contentDocId)) ?? "";

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
              Edit project
            </h1>
            <Badge
              variant={STATUS_VARIANT[project.status] ?? "outline"}
              className="capitalize"
            >
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.title}
          </p>
        </div>
        {project.status === "published" ? (
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-brand-teal hover:underline"
          >
            View live project
            <ExternalLink className="size-3.5" />
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        <ProjectForm
          projectId={project.id}
          initialTitle={project.title}
          initialSummary={project.summary}
          initialCategory={project.category}
          initialBody={body}
          status={project.status}
          rejectionReason={project.rejectionReason}
        />
      </div>
    </div>
  );
}
