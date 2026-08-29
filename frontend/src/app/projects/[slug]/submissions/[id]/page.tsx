import { notFound } from "next/navigation";
import { getPublicSubmission } from "@/actions/submissions";
import { getContentDoc } from "@/db/content";
import { SubmissionViewPanel } from "@/components/submission-view-panel";

export default async function PublicSubmissionPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const submission = await getPublicSubmission(id);
  if (!submission || submission.projectSlug !== slug) notFound();

  const body = (await getContentDoc(submission.contentDocId)) ?? "";

  return <SubmissionViewPanel submission={submission} body={body} variant="page" />;
}
