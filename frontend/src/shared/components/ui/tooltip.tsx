"use client"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import * as React from "react"

import { cn } from "@/shared/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  // The previous (Base UI) provider took `delay`; kept so callers don't break.
  delay,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider> & {
  delay?: number
}) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delay ?? delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

// Supports both Radix's `asChild` and the `render={<Button />}` convention the
// app's call sites use.
function TooltipTrigger({
  render,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger> & {
  render?: React.ReactElement
}) {
  if (render) {
    return (
      <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} asChild>
        {React.cloneElement(
          render,
          undefined,
          ...(children === undefined ? [] : [children]),
        )}
      </TooltipPrimitive.Trigger>
    )
  }

  return (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  )
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) rounded-lg border-2 border-edge bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-hard-3 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
