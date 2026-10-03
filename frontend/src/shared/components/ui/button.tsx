"use client"

import { Slot, Slottable } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/components/ui/button-variants"

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

  // `render={<Link />}` renders the button's styles/props onto that element,
  // with `children` appended inside it. Goes through Slottable rather than
  // React.cloneElement(render): when a server component passes `render`,
  // it can arrive here as a lazy element, and cloning that yields an
  // element of type undefined. Slot unwraps lazy Slottable children.
  if (render) {
    return (
      <Slot data-slot="button" className={classes} {...props}>
        <Slottable>{render}</Slottable>
        {children}
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
