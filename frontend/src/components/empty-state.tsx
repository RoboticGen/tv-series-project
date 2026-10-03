import type { LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="rounded-xl bg-brand-sky/5">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-16 rounded-full bg-brand-teal text-white shadow-[3px_3px_0_0_var(--edge)] motion-safe:animate-bounce motion-safe:[animation-duration:2s] [&_svg:not([class*='size-'])]:size-7"
        >
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-lg">{title}</EmptyTitle>
        <EmptyDescription className="font-medium text-pretty text-muted-foreground">{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
