/**
 * Componente Sidebar Principal
 *
 * Container principal do sidebar com suporte a diferentes variantes,
 * lados e modos de colapso. Responsivo e acessível.
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { PanelLeft } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useSidebar } from "../context/sidebar-context"
import type { SidebarProps } from "../types/sidebar-types"
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_MOBILE,
  SIDEBAR_WIDTH_ICON,
} from "../constants/sidebar-constants"

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  // Se não for colapsível, renderiza simples
  if (collapsible === "none") {
    return (
      <div
        className={cn(
          `flex h-full w-[${SIDEBAR_WIDTH}] flex-col bg-sidebar text-sidebar-foreground`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  // Mobile: usa Sheet para overlay
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className={`w-[${SIDEBAR_WIDTH_MOBILE}] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden`}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: layout fixo com animações
  return (
    <div
      className={cn(
        "group peer hidden md:block text-sidebar-foreground",
        `data-[state=${state}]`,
        `data-[collapsible=${state === "collapsed" ? collapsible : ""}]`,
        `data-[variant=${variant}]`,
        `data-[side=${side}]`
      )}
    >
      {/* Espaçador para gap no desktop */}
      <div
        className={cn(
          `duration-200 relative h-svh w-[${SIDEBAR_WIDTH}] bg-transparent transition-[width] ease-linear`,
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? `group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]`
            : `group-data-[collapsible=icon]:w-[${SIDEBAR_WIDTH_ICON}]`
        )}
      />

      {/* Sidebar principal */}
      <div
        className={cn(
          `duration-200 fixed inset-y-0 z-10 hidden h-svh w-[${SIDEBAR_WIDTH}] transition-[left,right,width] ease-linear md:flex`,
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Ajustes de padding para variantes
          variant === "floating" || variant === "inset"
            ? `p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]`
            : `group-data-[collapsible=icon]:w-[${SIDEBAR_WIDTH_ICON}] group-data-[side=left]:border-r group-data-[side=right]:border-l`,
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
