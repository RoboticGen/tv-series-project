import type { LucideIcon } from "lucide-react";

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
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-brand-navy bg-brand-sky/5 px-6 py-14 text-center dark:border-white">
      <div className="flex size-16 items-center justify-center rounded-full border-2 border-brand-navy bg-brand-teal text-white shadow-[3px_3px_0_0_var(--brand-navy)] motion-safe:animate-bounce motion-safe:[animation-duration:2s] dark:border-white dark:shadow-[3px_3px_0_0_#fff]">
        <Icon className="size-7" aria-hidden />
      </div>
      <div>
        <p className="font-heading text-lg font-black text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
