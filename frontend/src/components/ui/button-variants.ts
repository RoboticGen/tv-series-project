import { cva } from "class-variance-authority"

// Lives outside button.tsx (a "use client" module) so server components can
// style a plain <Link> as a button -- a function exported from a client
// module can't be called on the server, and passing <Link /> elements into
// <Button render> across the server/client boundary is unreliable in dev.
//
// Neobrutalism (https://neobrutalism.dev) button. The registry ships
// default/noShadow/neutral/reverse; the semantic variants below (outline,
// secondary, ghost, destructive, link) are additions this app's call sites
// depend on, styled in the same language. Dark mode is also an addition --
// the registry has none.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-(--duration-press) outline-none select-none focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-2 border-edge bg-primary text-primary-foreground shadow-hard-3 hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[3px] active:translate-y-[3px] hover:shadow-none active:shadow-none",
        noShadow:
          "border-2 border-edge bg-primary text-primary-foreground",
        neutral:
          "border-2 border-edge bg-background text-foreground shadow-hard-3 hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[3px] active:translate-y-[3px] hover:shadow-none active:shadow-none",
        reverse:
          "border-2 border-edge bg-primary text-primary-foreground hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-hard-3",
        outline:
          "border-2 border-edge bg-background text-foreground shadow-hard-3 hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[3px] active:translate-y-[3px] hover:bg-muted hover:shadow-none active:shadow-none aria-expanded:bg-muted dark:bg-input/30",
        secondary:
          "border-2 border-edge bg-secondary text-secondary-foreground shadow-hard-3 hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[3px] active:translate-y-[3px] hover:shadow-none active:shadow-none aria-expanded:bg-secondary",
        ghost:
          "border-2 border-transparent bg-transparent text-foreground hover:border-edge hover:bg-muted aria-expanded:border-edge aria-expanded:bg-muted dark:hover:bg-muted/50",
        destructive:
          "border-2 border-destructive bg-destructive/10 text-destructive shadow-[3px_3px_0_0_var(--destructive)] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[3px] active:translate-y-[3px] hover:bg-destructive/20 hover:shadow-none active:shadow-none dark:bg-destructive/20",
        link: "border-2 border-transparent bg-transparent text-teal-ink underline-offset-4 hover:underline",
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
