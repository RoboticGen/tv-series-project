"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getUnreadNotificationCount } from "@/actions/notifications";

export const NOTIFICATIONS_PATH = "/dashboard/notifications";
const POLL_MS = 60_000;
export function useUnreadNotifications() {
  const pathname = usePathname();
  const { status } = useSession();
  const [count, setCount] = React.useState(0);
  const onPage = pathname === NOTIFICATIONS_PATH;

  React.useEffect(() => {
    if (status !== "authenticated" || onPage) return;
    let cancelled = false;
    function refresh() {
      if (document.visibilityState !== "visible") return;
      getUnreadNotificationCount()
        .then((unread) => {
          if (!cancelled) setCount(unread);
        })
        .catch(() => {});
    }
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [status, onPage, pathname]);

  return onPage ? 0 : count;
}
