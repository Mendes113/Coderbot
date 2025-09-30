/**
 * Sidebar Component System
 *
 * Sistema completo e organizado de componentes para sidebar seguindo padrões da indústria.
 *
 * Benefícios da refatoração:
 * - Separação clara de responsabilidades
 * - Melhor organização de código
 * - Facilita manutenção e testes
 * - Tipagem mais robusta
 * - Reutilização de componentes
 * - Performance otimizada
 */

// Exportar tudo do sistema organizado
export * from "./components"

// Para compatibilidade com código existente, manter exportações diretas
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./components"
