import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "motion-safe:animate-pulse rounded-base bg-secondary-background border-2 border-edge",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
