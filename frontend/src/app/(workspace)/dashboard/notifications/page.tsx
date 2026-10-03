import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { getEmailPreferences } from "@/features/email-digest/services/queries";
import { getMyNotifications } from "@/features/notifications/services/queries";
import { EmailDigestSettings } from "@/features/email-digest/components/email-digest-settings";
import { EmptyState } from "@/shared/components/empty-state";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { SITE_NAME } from "@/lib/config/site";

export const metadata: Metadata = { title: `Notifications — ${SITE_NAME}` };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const [items, emailPreferences] = await Promise.all([getMyNotifications(), getEmailPreferences()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-heading text-3xl font-black tracking-tight text-foreground">
        Notifications
      </h1>
      <p className="mt-1 text-sm font-medium text-muted-foreground">
        Stars, builds, comments and news about your projects.
      </p>
      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nothing new yet"
            description="When someone stars, builds or comments on your projects, you'll see it here."
          />
        ) : (
          <NotificationList items={items} />
        )}
      </div>
      <div className="mt-8">
        <EmailDigestSettings {...emailPreferences} />
      </div>
    </div>
  );
}
