/**
 * Tipos TypeScript para o componente Sidebar
 *
 * Define interfaces e tipos utilizados em todo o sistema de sidebar
 * para garantir consistência e type safety.
 */

import type { VariantProps } from "class-variance-authority"

export type SidebarState = "expanded" | "collapsed"

export type SidebarSide = "left" | "right"

export type SidebarVariant = "sidebar" | "floating" | "inset"

export type SidebarCollapsible = "offcanvas" | "icon" | "none"

export type SidebarContextType = {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean | ((value: boolean) => boolean)) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export interface SidebarProviderProps {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export interface SidebarProps {
  side?: SidebarSide
  variant?: SidebarVariant
  collapsible?: SidebarCollapsible
  className?: string
  children: React.ReactNode
}

export interface SidebarMenuButtonProps {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof import("@/components/ui/tooltip").TooltipContent>
  className?: string
}

export type SidebarMenuButtonVariants = VariantProps<typeof import("../utils/sidebar-variants").sidebarMenuButtonVariants>

export interface SidebarMenuActionProps {
  asChild?: boolean
  showOnHover?: boolean
  className?: string
}

export interface SidebarMenuSubButtonProps {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
  className?: string
}

export interface SidebarMenuSkeletonProps {
  showIcon?: boolean
  className?: string
}
