"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Compass, ClipboardCheck, Menu, X, LogOut } from "lucide-react";
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isReviewer =
    session?.user?.role === "mentor" || session?.user?.role === "admin";
  const navItems = isReviewer ? [...NAV_ITEMS, ...REVIEWER_NAV_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-full bg-brand-teal text-sm font-bold text-white">
          R
        </div>
        <span className="font-heading text-sm font-bold text-brand-navy dark:text-white">
          RoboticGen Projects
        </span>
      </div>

      <div className="px-3">
        <NewProjectButton
          className="w-full justify-start rounded-lg"
          onNavigate={onNavigate}
        />
      </div>

      <nav className="mt-4 flex flex-col gap-1 px-3">
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
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <Separator className="mb-3" />
        {session?.user ? (
          <div className="flex items-center gap-2.5 rounded-lg p-2">
            <Avatar size="sm">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "You"} />
              <AvatarFallback>
                {(session.user.name ?? session.user.email ?? "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {session.user.name ?? session.user.email}
              </p>
              <Badge variant="secondary" className="mt-0.5 capitalize">
                {session.user.role}
              </Badge>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => signOut()}
              title="Sign out"
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

  return (
    <>
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-brand-teal text-xs font-bold text-white">
            R
          </div>
          <span className="font-heading text-sm font-bold text-brand-navy dark:text-white">
            RoboticGen Projects
          </span>
        </div>
        <Button size="icon-sm" variant="outline" onClick={() => setMobileOpen(true)}>
          <Menu className="size-4" />
        </Button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-card">
            <Button
              size="icon-sm"
              variant="ghost"
              className="absolute top-4 right-3"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </Button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r bg-card md:flex md:flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
