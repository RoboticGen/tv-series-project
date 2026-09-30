import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

// Neobrutalism badge. Registry ships default/neutral; secondary, outline,
// destructive, ghost and link are additions this app's call sites use.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border-2 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-brand-navy bg-primary text-primary-foreground dark:border-edge [a]:hover:bg-primary/80",
        neutral:
          "border-brand-navy bg-background text-foreground dark:border-edge",
        secondary:
          "border-brand-navy bg-secondary text-secondary-foreground dark:border-edge [a]:hover:bg-secondary/80",
        outline:
          "border-brand-navy text-foreground dark:border-edge [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        destructive:
          "border-destructive bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 [a]:hover:bg-destructive/20",
        ghost:
          "border-transparent hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  render,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    render?: React.ReactElement
  }) {
  const classes = cn(badgeVariants({ variant }), className)

  if (render) {
    return (
      <Slot data-slot="badge" className={classes} {...props}>
        {React.cloneElement(
          render,
          undefined,
          ...(children === undefined ? [] : [children]),
        )}
      </Slot>
    )
  }

  const Comp = asChild ? Slot : "span"

  return (
    <Comp data-slot="badge" className={classes} {...props}>
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
