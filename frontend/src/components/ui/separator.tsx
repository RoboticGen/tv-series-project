"use client"

import * as SeparatorPrimitive from "@radix-ui/react-separator"

import * as React from "react"

import { cn } from "@/lib/utils"

// The neobrutalism registry has no separator; this follows its conventions
// (solid brand-navy rule rather than a hairline) on the Radix primitive.
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "shrink-0 bg-edge data-[orientation=horizontal]:h-0.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-0.5 data-[orientation=vertical]:self-stretch",
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
