import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "mentor" && session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
