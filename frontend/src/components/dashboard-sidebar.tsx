"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Compass, ClipboardCheck, ShieldCheck, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { NewProjectButton } from "@/components/new-project-button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Browse projects", icon: Compass },
];

const REVIEWER_NAV_ITEMS = [
  { href: "/dashboard/review", label: "Review queue", icon: ClipboardCheck },
];

const ADMIN_NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isReviewer =
    session?.user?.role === "mentor" || session?.user?.role === "admin";
  const isAdmin = session?.user?.role === "admin";
  const navItems = [
    ...NAV_ITEMS,
    ...(isReviewer ? REVIEWER_NAV_ITEMS : []),
    ...(isAdmin ? ADMIN_NAV_ITEMS : []),
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-sm border-2 border-brand-navy bg-brand-teal text-sm font-black text-white shadow-[2px_2px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[2px_2px_0_0_#fff]">
          R
        </div>
        <span className="font-heading text-sm font-black tracking-tight text-brand-navy dark:text-white">
          RoboticGen Projects
        </span>
      </div>

      <div className="px-3">
        <NewProjectButton className="w-full justify-start" onNavigate={onNavigate} />
      </div>

      <nav aria-label="Main" className="mt-4 flex flex-col gap-1.5 px-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md border-2 px-3 py-2 text-sm font-bold transition-all",
                isActive
                  ? "border-brand-navy bg-brand-teal text-white shadow-[3px_3px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[3px_3px_0_0_#fff]"
                  : "border-transparent text-muted-foreground hover:border-brand-navy hover:bg-muted hover:text-foreground dark:hover:border-white",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <Separator className="mb-3 border-2 border-brand-navy dark:border-white" />
        {session?.user ? (
          <div className="flex items-center gap-2.5 rounded-md border-2 border-brand-navy p-2 dark:border-white">
            <Avatar size="sm">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "You"} />
              <AvatarFallback>
                {(session.user.name ?? session.user.email ?? "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {session.user.name ?? session.user.email}
              </p>
              <Badge variant="secondary" className="mt-0.5 uppercase">
                {session.user.role}
              </Badge>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              className="hover:bg-brand-coral/20"
              onClick={() => signOut()}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <header className="flex items-center justify-between border-b-2 border-brand-navy bg-card px-4 py-3 md:hidden dark:border-white">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-sm border-2 border-brand-navy bg-brand-teal text-xs font-black text-white shadow-[2px_2px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[2px_2px_0_0_#fff]">
            R
          </div>
          <span className="font-heading text-sm font-black tracking-tight text-brand-navy dark:text-white">
            RoboticGen Projects
          </span>
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="size-4" />
        </Button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col border-r-2 border-brand-navy bg-card dark:border-white">
            <Button
              size="icon-sm"
              variant="ghost"
              className="absolute top-4 right-3"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r-2 border-brand-navy bg-card md:flex md:flex-col dark:border-white">
        <SidebarContent />
      </aside>
    </>
  );
}
