import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-brand-navy bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--brand-navy)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary hover:shadow-[5px_5px_0_0_var(--brand-navy)] active:translate-x-0 active:translate-y-0 active:shadow-none dark:border-white dark:shadow-[3px_3px_0_0_#fff] dark:hover:shadow-[5px_5px_0_0_#fff]",
        outline:
          "border-brand-navy bg-background shadow-[3px_3px_0_0_var(--brand-navy)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-muted hover:text-foreground hover:shadow-[5px_5px_0_0_var(--brand-navy)] active:translate-x-0 active:translate-y-0 active:shadow-none aria-expanded:bg-muted aria-expanded:text-foreground dark:border-white dark:bg-input/30 dark:shadow-[3px_3px_0_0_#fff] dark:hover:bg-input/50 dark:hover:shadow-[5px_5px_0_0_#fff]",
        secondary:
          "border-brand-navy bg-secondary text-secondary-foreground shadow-[3px_3px_0_0_var(--brand-navy)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-[5px_5px_0_0_var(--brand-navy)] active:translate-x-0 active:translate-y-0 active:shadow-none aria-expanded:bg-secondary aria-expanded:text-secondary-foreground dark:border-white dark:shadow-[3px_3px_0_0_#fff] dark:hover:shadow-[5px_5px_0_0_#fff]",
        ghost:
          "hover:border-brand-navy hover:bg-muted hover:text-foreground aria-expanded:border-brand-navy aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:border-white dark:hover:bg-muted/50 dark:aria-expanded:border-white",
        destructive:
          "border-destructive bg-destructive/10 text-destructive shadow-[3px_3px_0_0_var(--destructive)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-destructive/20 hover:shadow-[5px_5px_0_0_var(--destructive)] active:translate-x-0 active:translate-y-0 active:shadow-none dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
