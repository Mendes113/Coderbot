import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  MessageCircle,
  BookOpen,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
  PenTool,
  FileText,
  BarChart3,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children?: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      label: 'Início',
      href: '/',
      icon: <Home className="h-5 w-5" />,
      active: location.pathname === '/'
    },
    {
      label: 'Chat',
      href: '/dashboard/chat',
      icon: <MessageCircle className="h-5 w-5" />,
      active: location.pathname === '/dashboard/chat'
    },
    {
      label: 'Exercícios',
      href: '/dashboard/exercises',
      icon: <BookOpen className="h-5 w-5" />,
      active: location.pathname === '/dashboard/exercises'
    },
    {
      label: 'Quadro',
      href: '/dashboard/whiteboard',
      icon: <PenTool className="h-5 w-5" />,
      active: location.pathname === '/dashboard/whiteboard'
    },
    {
      label: 'Anotações',
      href: '/dashboard/notes',
      icon: <FileText className="h-5 w-5" />,
      active: location.pathname === '/dashboard/notes'
    }
  ];

  const teacherNavigationItems = [
    {
      label: 'Dashboard Professor',
      href: '/teacher/dashboard',
      icon: <GraduationCap className="h-5 w-5" />,
      active: location.pathname.startsWith('/teacher')
    },
    {
      label: 'Turmas',
      href: '/teacher/classes',
      icon: <Users className="h-5 w-5" />,
      active: location.pathname === '/teacher/classes'
    },
    {
      label: 'Análises',
      href: '/teacher/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      active: location.pathname === '/teacher/analytics'
    }
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsMenuOpen(false);
  };

  const isTeacherRoute = location.pathname.startsWith('/teacher');

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img
              src="/coderbot_colorfull.png"
              alt="CoderBot"
              className="h-8 w-8"
            />
            <span className="font-semibold text-lg">CoderBot</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions for Mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/chat')}
              className="h-9 w-9 p-0"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <img
                        src="/coderbot_colorfull.png"
                        alt="CoderBot"
                        className="h-6 w-6"
                      />
                      <span className="font-semibold">Menu</span>
                    </div>
                    <SheetClose asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>

                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Navegação
                        </h3>
                        <div className="space-y-1">
                          {navigationItems.map((item) => (
                            <Button
                              key={item.href}
                              variant={item.active ? "secondary" : "ghost"}
                              className="w-full justify-start gap-3 h-12"
                              onClick={() => handleNavigation(item.href)}
                            >
                              {item.icon}
                              {item.label}
                              {item.active && (
                                <ChevronRight className="h-4 w-4 ml-auto" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {isTeacherRoute && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Professor
                          </h3>
                          <div className="space-y-1">
                            {teacherNavigationItems.map((item) => (
                              <Button
                                key={item.href}
                                variant={item.active ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3 h-12"
                                onClick={() => handleNavigation(item.href)}
                              >
                                {item.icon}
                                {item.label}
                                {item.active && (
                                  <ChevronRight className="h-4 w-4 ml-auto" />
                                )}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12"
                          onClick={() => handleNavigation('/profile')}
                        >
                          <Settings className="h-5 w-5" />
                          Configurações
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children || <Outlet />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "flex flex-col gap-1 h-full rounded-none",
                item.active ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
              onClick={() => handleNavigation(item.href)}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>

      {/* Spacer for bottom navigation */}
      <div className="h-16" />
    </div>
  );
}
