import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSubmissionById } from "@/actions/submissions";
import { getContentDoc } from "@/db/content";
import { SubmissionViewPanel } from "@/components/submission-view-panel";

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
    <SubmissionViewPanel
      submission={{
        createdAt: submission.createdAt,
        projectTitle: submission.projectTitle,
        projectSlug: submission.projectSlug,
        authorName: session.user.name ?? "You",
        authorAvatarUrl: session.user.image ?? null,
      }}
      body={body}
      isPrivate={submission.isPrivate}
      variant="page"
    />
  );
}
