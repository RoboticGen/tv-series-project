"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useSession, signOut } from "next-auth/react";
import { Bell, LayoutDashboard, Compass, ClipboardCheck, ShieldCheck, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Separator } from "@/shared/components/ui/separator";
import { NewProjectButton } from "@/features/projects/components/new-project-button";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { NOTIFICATIONS_PATH, useUnreadNotifications } from "@/features/notifications/hooks/use-unread-notifications";
import { SPRING_POP } from "@/shared/constants/motion";
import { cn } from "@/shared/lib/utils";
import { SITE_NAME } from "@/lib/config/site";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: NOTIFICATIONS_PATH, label: "Notifications", icon: Bell },
  { href: "/projects", label: "Browse projects", icon: Compass },
];

function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.3 }}
      animate={{ scale: 1 }}
      transition={SPRING_POP}
      className={cn(
        "rounded-full border-2 border-edge bg-brand-coral px-1.5 text-xs leading-4 font-black tabular-nums text-brand-navy",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only"> unread</span>
    </motion.span>
  );
}

const REVIEWER_NAV_ITEMS = [
  { href: "/dashboard/review", label: "Review queue", icon: ClipboardCheck },
];

const ADMIN_NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
];

function SidebarContent({ unread, onNavigate }: { unread: number; onNavigate?: () => void }) {
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
        <div className="flex size-8 items-center justify-center rounded-sm border-2 border-edge bg-brand-teal text-sm font-black text-brand-navy shadow-hard-2">
          O
        </div>
        <span className="font-heading text-sm font-black tracking-tight text-foreground">
          {SITE_NAME}
        </span>
        {/* The mobile drawer's close button sits in this corner instead;
            the mobile top bar has its own toggle. */}
        <ThemeToggle className="ml-auto hidden md:inline-flex" />
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
                  ? "border-edge bg-brand-teal text-brand-navy shadow-hard-3"
                  : "border-transparent text-muted-foreground hover:border-edge hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
              {item.href === NOTIFICATIONS_PATH ? <UnreadBadge count={unread} className="ml-auto" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <Separator className="mb-3 border-2 border-edge" />
        {session?.user ? (
          <div className="flex items-center gap-2.5 rounded-md border-2 border-edge p-2">
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
  const unread = useUnreadNotifications();

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
      <header className="flex items-center justify-between border-b-2 border-edge bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-sm border-2 border-edge bg-brand-teal text-xs font-black text-brand-navy shadow-hard-2">
            O
          </div>
          <span className="font-heading text-sm font-black tracking-tight text-foreground">
            {SITE_NAME}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            size="icon-sm"
            variant="outline"
            nativeButton={false}
            className="relative"
            render={<Link href={NOTIFICATIONS_PATH} aria-label="Notifications" />}
          >
            <motion.span
              key={unread}
              className="flex origin-top"
              animate={unread > 0 ? { rotate: [0, -20, 16, -10, 6, 0] } : undefined}
              transition={{ duration: 0.6 }}
            >
              <Bell className="size-4" aria-hidden />
            </motion.span>
            <UnreadBadge count={unread} className="absolute -top-2 -right-2" />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-4" />
          </Button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col border-r-2 border-edge bg-card">
            <Button
              size="icon-sm"
              variant="ghost"
              className="absolute top-4 right-3"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
            <SidebarContent unread={unread} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r-2 border-edge bg-card md:flex md:flex-col">
        <SidebarContent unread={unread} />
      </aside>
    </>
  );
}
