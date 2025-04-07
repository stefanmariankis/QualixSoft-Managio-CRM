import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Receipt, 
  FileText, 
  Gauge, 
  Calendar, 
  Settings, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  UserRound,
  Building2
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, organization, signOut } = useAuth();
  const [currentLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Reset mobile menu state when screen size changes
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  // Verificăm dacă organizația are departamente activate
  const hasDepartments = organization?.has_departments ?? false;
  
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clients", label: "Clienți", icon: Users },
    { href: "/projects", label: "Proiecte", icon: FolderKanban },
    { href: "/tasks", label: "Sarcini", icon: FileText },
    { href: "/invoices", label: "Facturi", icon: Receipt },
    { href: "/team", label: "Echipă", icon: UserRound },
    // Afișăm link-ul către departamente doar dacă funcționalitatea este activată
    ...(hasDepartments ? [{ href: "/departments", label: "Departamente", icon: Building2 }] : []),
    { href: "/automations", label: "Automatizări", icon: Gauge },
    { href: "/templates", label: "Template-uri", icon: FileText },
    { href: "/reports", label: "Rapoarte", icon: Gauge },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/settings", label: "Setări", icon: Settings },
  ];

  const userInitials = user ? 
    (user.first_name?.charAt(0) || '') + (user.last_name?.charAt(0) || '') : 
    'U';

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar - desktop */}
      <div 
        className={cn(
          "fixed left-0 top-0 z-20 h-full border-r border-border bg-card transition-all duration-300 hidden lg:flex flex-col",
          collapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center border-b px-4">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            {!collapsed && (
              <h1 className="text-xl font-bold text-foreground">Managio</h1>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  currentLocation === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}>
                  <item.icon size={20} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        {/* User area */}
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar_url || ''} alt={user?.first_name || 'Utilizator'} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium leading-none text-foreground truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
            {!collapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto" 
                onClick={() => signOut()}
              >
                <LogOut size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile header & menu */}
      <div className="fixed top-0 left-0 right-0 z-20 border-b bg-background lg:hidden">
        <div className="flex h-16 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-xl font-bold text-foreground">Managio</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell size={20} />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar_url || ''} alt={user?.first_name || 'Utilizator'} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-50 bg-background">
            <nav className="grid gap-2 p-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                      currentLocation === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
              <Separator className="my-2" />
              <Button 
                variant="ghost" 
                className="justify-start px-3 font-normal"
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut size={20} className="mr-3" />
                <span>Deconectare</span>
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* Main content */}
      <div 
        className={cn(
          "flex flex-col flex-1 transition-all duration-300",
          collapsed ? "lg:ml-[70px]" : "lg:ml-[260px]",
          "pt-16 lg:pt-0"
        )}
      >
        <main className="flex-1 px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}