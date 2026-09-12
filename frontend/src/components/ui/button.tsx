"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

// Neobrutalism (https://neobrutalism.dev) button. The registry ships
// default/noShadow/neutral/reverse; the semantic variants below (outline,
// secondary, ghost, destructive, link) are additions this app's call sites
// depend on, styled in the same language. Dark mode is also an addition --
// the registry has none.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-2 border-brand-navy bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--brand-navy)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none dark:border-white dark:shadow-[3px_3px_0_0_#fff]",
        noShadow:
          "border-2 border-brand-navy bg-primary text-primary-foreground dark:border-white",
        neutral:
          "border-2 border-brand-navy bg-background text-foreground shadow-[3px_3px_0_0_var(--brand-navy)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none dark:border-white dark:shadow-[3px_3px_0_0_#fff]",
        reverse:
          "border-2 border-brand-navy bg-primary text-primary-foreground hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[3px_3px_0_0_var(--brand-navy)] dark:border-white dark:hover:shadow-[3px_3px_0_0_#fff]",
        outline:
          "border-2 border-brand-navy bg-background text-foreground shadow-[3px_3px_0_0_var(--brand-navy)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-muted hover:shadow-none aria-expanded:bg-muted dark:border-white dark:bg-input/30 dark:shadow-[3px_3px_0_0_#fff]",
        secondary:
          "border-2 border-brand-navy bg-secondary text-secondary-foreground shadow-[3px_3px_0_0_var(--brand-navy)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none aria-expanded:bg-secondary dark:border-white dark:shadow-[3px_3px_0_0_#fff]",
        ghost:
          "border-2 border-transparent bg-transparent text-foreground hover:border-brand-navy hover:bg-muted aria-expanded:border-brand-navy aria-expanded:bg-muted dark:hover:border-white dark:hover:bg-muted/50 dark:aria-expanded:border-white",
        destructive:
          "border-2 border-destructive bg-destructive/10 text-destructive shadow-[3px_3px_0_0_var(--destructive)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-destructive/20 hover:shadow-none dark:bg-destructive/20",
        link: "border-2 border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3 py-2",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-5",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  render,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    render?: React.ReactElement
    nativeButton?: boolean
  }) {
  // Base UI's Button took `nativeButton` alongside `render`. It means nothing to
  // the Radix-based component, so drop it rather than leak it to the DOM.
  delete props.nativeButton

  const classes = cn(buttonVariants({ variant, size, className }))

  // `render={<Link />}` renders the button's styles/props onto that element.
  if (render) {
    return (
      <Slot data-slot="button" className={classes} {...props}>
        {React.cloneElement(
          render,
          undefined,
          ...(children === undefined ? [] : [children]),
        )}
      </Slot>
    )
  }

  const Comp = asChild ? Slot : "button"

  return (
    <Comp data-slot="button" className={classes} {...props}>
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
