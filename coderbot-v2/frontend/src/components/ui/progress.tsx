import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  showToggle?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, showToggle = false, isCollapsed = false, onToggle, ...props }, ref) => (
  <div className="relative flex items-center">
    {showToggle && (
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-center",
          "w-8 h-8 rounded-lg bg-primary hover:bg-primary/90",
          "text-primary-foreground transition-colors"
        )}
        aria-label={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
))

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
