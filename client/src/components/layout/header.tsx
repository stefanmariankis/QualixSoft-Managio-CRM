import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { 
  Bell, 
  LogOut,
  User,
  Settings,
  Check,
  Trash,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/hooks/use-notifications";
import { Notification } from "@shared/schema";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

export default function Header() {
  const { user, signOut } = useAuth();
  const { 
    notifications, 
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  
  // Get unread notifications
  const unreadNotifications = notifications.filter(notification => !notification.read_at);
  
  // Add a bell shake animation if there are new notifications
  useEffect(() => {
    if (unreadNotifications.length > 0 && bellRef.current) {
      bellRef.current.classList.add("animate-bell");
      
      const timeout = setTimeout(() => {
        bellRef.current?.classList.remove("animate-bell");
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [unreadNotifications.length]);
  
  const openNotificationTarget = (notification: Notification) => {
    // Mark notification as read
    markAsRead(notification.id);
    
    // Close notifications dialog
    setNotificationsOpen(false);
    
    // Navigate to the target based on entity type and id
    if (notification.entity_type && notification.entity_id) {
      let targetUrl = `/`;
      
      switch (notification.entity_type) {
        case 'task':
          targetUrl = `/tasks/${notification.entity_id}`;
          break;
        case 'project':
          targetUrl = `/projects/${notification.entity_id}`;
          break;
        case 'invoice':
          targetUrl = `/invoices/${notification.entity_id}`;
          break;
        case 'client':
          targetUrl = `/clients/${notification.entity_id}`;
          break;
        case 'user':
          targetUrl = `/team/${notification.entity_id}`;
          break;
        default:
          targetUrl = `/dashboard`;
      }
      
      // Use window.location for hard navigation to ensure page refresh with new data
      window.location.href = targetUrl;
    }
  };
  
  const userInitials = user ? 
    (user.first_name?.charAt(0) || '') + (user.last_name?.charAt(0) || '') : 
    'U';
    
  return (
    <div className="flex items-center ml-auto">
      {/* Notifications button */}
      <Button 
        ref={bellRef}
        variant="ghost" 
        size="icon" 
        className="relative mr-2" 
        onClick={() => setNotificationsOpen(true)}
      >
        <Bell size={20} />
        {unreadNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
            {unreadNotifications.length}
          </span>
        )}
      </Button>
      
      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="px-2">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={user?.avatar_url || ''} alt={user?.first_name || 'Utilizator'} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left mr-1">
              <span className="text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-xs text-muted-foreground">{user?.role === 'ceo' ? 'Administrator' : user?.role}</span>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Contul meu</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <Link href="/profile">Profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <Link href="/settings">Setări</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Deconectare</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Notifications dialog */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notificări
              {unreadNotifications.length > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                  {unreadNotifications.length} necitite
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="flex justify-between">
              <span>Lista de notificări</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
                  <Check className="mr-1 h-3 w-3" />
                  Marchează tot ca citit
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteAllNotifications()}>
                  <Trash className="mr-1 h-3 w-3" />
                  Șterge tot
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nu aveți notificări
              </div>
            ) : (
              <div className="grid gap-2">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "rounded-lg border p-3 relative cursor-pointer transition-colors hover:bg-muted/50",
                      !notification.read_at && "bg-muted/20"
                    )}
                    onClick={() => openNotificationTarget(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground">{notification.content}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: ro })}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {!notification.read_at && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNotificationsOpen(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}