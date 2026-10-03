"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { EyeOff, Hammer, MessageCircle, Reply, Sparkles, Star, UserPlus } from "lucide-react";
import { markAllNotificationsRead, type MyNotification } from "@/actions/notifications";
import { timeAgo } from "@/components/recent-points";
import { cn } from "@/lib/utils";

const TYPES: Record<
  MyNotification["type"],
  { icon: LucideIcon; fill: string; describe: (actor: string) => string }
> = {
  project_starred: { icon: Star, fill: "bg-brand-yellow text-brand-navy", describe: (a) => `${a} starred` },
  project_featured: { icon: Sparkles, fill: "bg-brand-coral text-brand-navy", describe: () => "Mentors featured" },
  project_built: { icon: Hammer, fill: "bg-brand-green text-brand-navy", describe: () => "Someone built" },
  project_unpublished: { icon: EyeOff, fill: "bg-destructive text-white", describe: () => "A mentor unpublished" },
  project_commented: { icon: MessageCircle, fill: "bg-brand-sky text-brand-navy", describe: (a) => `${a} commented on` },
  comment_replied: { icon: Reply, fill: "bg-brand-teal text-brand-navy", describe: (a) => `${a} replied to your comment on` },
  new_follower: { icon: UserPlus, fill: "bg-brand-navy text-white dark:bg-foreground dark:text-brand-navy", describe: (a) => `${a} started following you` },
};

function Subject({ item }: { item: MyNotification }) {
  if (item.type === "new_follower") {
    return item.actorId ? (
      <Link href={`/authors/${item.actorId}`} className="font-bold text-foreground underline-offset-2 hover:underline">
        View profile
      </Link>
    ) : null;
  }
  if (item.projectSlug && item.projectViewable) {
    return (
      <Link
        href={`/projects/${item.projectSlug}`}
        className="font-bold text-foreground underline-offset-2 hover:underline"
      >
        {item.projectTitle}
      </Link>
    );
  }
  return <span className="font-bold">{item.projectTitle ?? "a project"}</span>;
}

export function NotificationList({ items }: { items: MyNotification[] }) {
  const hasUnread = items.some((item) => !item.readAt);

  // Seeing the list is what marks it read; this render keeps the highlights.
  React.useEffect(() => {
    if (hasUnread) void markAllNotificationsRead();
  }, [hasUnread]);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const { icon: Icon, fill, describe } = TYPES[item.type];
        return (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border-2 border-edge bg-card p-4 text-sm",
              !item.readAt &&
                "bg-brand-yellow/15 shadow-hard-4",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-edge",
                fill,
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 font-medium text-pretty">
              <p>
                {!item.readAt ? <span className="sr-only">New: </span> : null}
                {describe(item.actorName ?? "Someone")} <Subject item={item} />
              </p>
              {item.detail ? (
                <p className="mt-1 rounded-md border-2 border-brand-navy/20 bg-muted px-2 py-1 text-muted-foreground dark:border-edge/60">
                  {item.detail}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
                {timeAgo(item.createdAt)}
              </p>
            </div>
            {item.points ? (
              <span className="shrink-0 rounded-full border-2 border-edge bg-brand-green/20 px-2 py-0.5 font-sans font-black tabular-nums text-foreground">
                +{item.points}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
