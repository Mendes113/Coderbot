import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 edu-shadow-interactive",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 edu-shadow-interactive",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground edu-shadow-interactive",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 edu-shadow-interactive",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Variantes educacionais personalizadas
        "edu-primary":
          "bg-[hsl(var(--education-primary))] text-white hover:bg-[hsl(var(--education-primary-dark))] edu-shadow-interactive edu-shadow-primary",
        "edu-secondary":
          "bg-[hsl(var(--education-secondary))] text-[hsl(var(--education-text-primary))] hover:bg-[hsl(var(--education-secondary-600))] border border-[hsl(var(--border))] edu-shadow-interactive",
        "edu-success":
          "bg-[hsl(var(--education-success))] text-white hover:bg-[hsl(var(--education-success-600))] edu-shadow-interactive edu-shadow-success",
        "edu-warning":
          "bg-[hsl(var(--education-warning))] text-white hover:bg-[hsl(var(--education-warning-600))] edu-shadow-interactive edu-shadow-warning",
        "edu-error":
          "bg-[hsl(var(--education-error))] text-white hover:bg-[hsl(var(--education-error-600))] edu-shadow-interactive edu-shadow-error",
        "edu-outline":
          "border-2 border-[hsl(var(--education-primary))] bg-transparent text-[hsl(var(--education-primary))] hover:bg-[hsl(var(--education-primary))] hover:text-white edu-shadow-interactive",
        "edu-ghost":
          "text-[hsl(var(--education-primary))] hover:bg-[hsl(var(--education-primary))/10] edu-shadow-interactive",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        "edu-xs": "h-7 text-xs px-2 py-1 rounded-md",
        "edu-sm": "h-8 text-sm px-3 py-1.5 rounded-lg",
        "edu-md": "h-9 text-sm px-4 py-2 rounded-lg",
        "edu-lg": "h-11 text-base px-6 py-3 rounded-lg",
        "edu-xl": "h-12 text-lg px-8 py-4 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
