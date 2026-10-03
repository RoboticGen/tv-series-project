import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border-2 border-control bg-background px-3 py-2 text-base font-medium text-foreground transition-all outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:shadow-hard-3 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:focus-visible:border-ring dark:bg-input/30 dark:disabled:bg-input/80",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
