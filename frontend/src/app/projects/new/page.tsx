import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createDraftProject } from "@/actions/projects";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  await createDraftProject();
}
