import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSubmissionById } from "@/actions/submissions";
import { getContentDoc } from "@/db/content";
import { MarkdownViewer } from "@/components/markdown-viewer";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/landing");

  const submission = await getSubmissionById(id, session.user.id);
  if (!submission) notFound();

  const body = (await getContentDoc(submission.contentDocId)) ?? "";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm text-muted-foreground">
        Your private submission for{" "}
        <Link
          href={`/projects/${submission.projectSlug}`}
          className="text-brand-teal hover:underline"
        >
          {submission.projectTitle}
        </Link>
      </p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-brand-navy dark:text-white">
        Submitted {submission.createdAt.toLocaleDateString()}
      </h1>
      <div className="mt-8 border-t pt-8">
        <MarkdownViewer body={body} />
      </div>
    </div>
  );
}
