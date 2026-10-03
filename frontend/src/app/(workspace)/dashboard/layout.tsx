import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/core/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  return <AppShell>{children}</AppShell>;
}
