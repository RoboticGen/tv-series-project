"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { getUnreadNotificationCount } from "@/features/notifications/actions";
import { toast } from "@/shared/components/toast";
import { queryKeys } from "@/shared/constants/query-keys";

export const NOTIFICATIONS_PATH = "/dashboard/notifications";
const POLL_MS = 60_000;

export function useUnreadNotifications() {
  const pathname = usePathname();
  const { status } = useSession();
  const onPage = pathname === NOTIFICATIONS_PATH;
  const lastSeen = React.useRef<number | null>(null);

  // Polling pauses while the tab is hidden and refetches on focus.
  const { data: unread } = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: () => getUnreadNotificationCount(),
    enabled: status === "authenticated" && !onPage,
    refetchInterval: POLL_MS,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (unread === undefined) return;
    if (lastSeen.current !== null && unread > lastSeen.current) {
      toast({ title: "You have a new notification", description: "Tap to see what happened.", href: NOTIFICATIONS_PATH });
    }
    lastSeen.current = unread;
  }, [unread]);

  return onPage ? 0 : (unread ?? 0);
}
