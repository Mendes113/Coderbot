/**
 * Índice dos Componentes do Sidebar
 *
 * Exporta todos os componentes organizados seguindo padrões da indústria
 */

// Contexto e Provider
export { SidebarProvider, useSidebar } from "../context/sidebar-context"

// Componentes principais
export { Sidebar } from "./sidebar"
export { SidebarTrigger } from "./sidebar-trigger"
export { SidebarInset } from "./sidebar-inset"

// Componentes de layout
export {
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarSeparator,
} from "./sidebar-menu"

// Componentes de grupo
export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./sidebar-menu"

// Componentes de menu
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./sidebar-menu"

// Componentes auxiliares
export { SidebarInput } from "./sidebar-menu"

// Re-exportar tipos para facilitar importação
export type {
  SidebarState,
  SidebarSide,
  SidebarVariant,
  SidebarCollapsible,
  SidebarContextType,
  SidebarProviderProps,
  SidebarProps,
  SidebarMenuButtonProps,
  SidebarMenuActionProps,
  SidebarMenuSubButtonProps,
  SidebarMenuSkeletonProps,
} from "../types/sidebar-types"

// Re-exportar constantes
export {
  SIDEBAR_CONSTANTS,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_MOBILE,
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_KEYBOARD_SHORTCUT,
} from "../constants/sidebar-constants"
