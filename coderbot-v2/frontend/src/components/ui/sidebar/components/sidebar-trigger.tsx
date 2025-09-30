/**
 * SidebarTrigger Component
 *
 * Botão para abrir/fechar o sidebar com ícone e funcionalidade de toggle.
 */

import * as React from "react"
import { PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "../context/sidebar-context"
import { cn } from "@/lib/utils"

interface SidebarTriggerProps extends React.ComponentProps<typeof Button> {
  className?: string
}

export function SidebarTrigger({ className, onClick, ...props }: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}
