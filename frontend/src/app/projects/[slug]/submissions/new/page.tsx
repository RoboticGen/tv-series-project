import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { SubmissionForm } from "@/components/submission-form";

export default async function NewSubmissionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/landing");

  const project = await getProjectBySlug(slug, session.user.id);
  if (!project) notFound();

  const isAuthor = project.authorId === session.user.id;
  if (!isAuthor && project.status !== "published") notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
        I built this: {project.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Write up how your build went. Only you can see this submission.
      </p>
      <div className="mt-8">
        <SubmissionForm projectId={project.id} />
      </div>
    </div>
  );
}
