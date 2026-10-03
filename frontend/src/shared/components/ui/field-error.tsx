import { cn } from "@/shared/lib/utils"

function FieldError({ id, className, children }: { id?: string; className?: string; children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p id={id} role="alert" data-slot="field-error" className={cn("text-sm font-medium text-destructive", className)}>
      {children}
    </p>
  )
}

export { FieldError }
