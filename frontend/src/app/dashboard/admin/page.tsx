import { Users, GraduationCap, ClipboardCheck, ShieldCheck, Ban } from "lucide-react";
import { auth } from "@/auth";
import { listUsersForAdmin } from "@/actions/admin";
import { StatTile } from "@/components/dashboard-stats";
import { UserManagementTable } from "@/components/user-management-table";

export default async function AdminPage() {
  const [session, allUsers] = await Promise.all([auth(), listUsersForAdmin()]);

  const count = (predicate: (u: (typeof allUsers)[number]) => boolean) =>
    allUsers.filter(predicate).length;

  const tiles = [
    { label: "Total users", value: allUsers.length, icon: Users, fill: "bg-brand-sky/20", iconFill: "bg-brand-sky" },
    { label: "Students", value: count((u) => u.role === "student"), icon: GraduationCap, fill: "bg-brand-green/20", iconFill: "bg-brand-green" },
    { label: "Mentors", value: count((u) => u.role === "mentor"), icon: ClipboardCheck, fill: "bg-brand-yellow/30", iconFill: "bg-brand-yellow" },
    { label: "Admins", value: count((u) => u.role === "admin"), icon: ShieldCheck, fill: "bg-brand-coral/20", iconFill: "bg-brand-coral" },
    { label: "Disabled", value: count((u) => u.isDisabled), icon: Ban, fill: "bg-destructive/20", iconFill: "bg-destructive" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <div className="border-b-[3px] border-brand-navy pb-6 dark:border-white">
        <span className="inline-block rounded-sm border-2 border-brand-navy bg-brand-navy px-2 py-0.5 text-xs font-black tracking-wide text-white uppercase shadow-[2px_2px_0_0_var(--brand-navy)] dark:border-white dark:bg-white dark:text-brand-navy dark:shadow-[2px_2px_0_0_#fff]">
          Admin
        </span>
        <h1 className="mt-2 text-balance font-heading text-3xl font-black tracking-tight text-brand-navy dark:text-white">
          User management
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Change roles, disable accounts, or remove users. Mentors can moderate
          projects; admins can also manage users.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </div>

      <div className="mt-10">
        <UserManagementTable users={allUsers} currentUserId={session!.user.id} />
      </div>
    </div>
  );
}
