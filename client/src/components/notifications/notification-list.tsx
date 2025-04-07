import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { AlertTriangle, Bell, Check, Info, Megaphone, Package, Trash2, Users, X } from "lucide-react";
import { Notification } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface NotificationListProps {
  onClose?: () => void;
}

export function NotificationList({ onClose }: NotificationListProps) {
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null);

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };

  const handleDelete = (id: number) => {
    deleteNotification(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Grupează notificările după dacă sunt citite sau nu
  const unreadNotifications = notifications?.filter(notification => !notification.read_at) || [];
  const readNotifications = notifications?.filter(notification => notification.read_at) || [];

  if (isLoading) {
    return (
      <div className="space-y-4 p-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (notifications === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="font-medium text-lg">Eroare la încărcarea notificărilor</h3>
        <p className="text-muted-foreground text-sm">
          Nu am putut încărca notificările. Încercați să reîmprospătați pagina.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
          Reîncărcați pagina
        </Button>
      </div>
    );
  }
  
  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <Bell className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="font-medium text-lg">Nu aveți notificări</h3>
        <p className="text-muted-foreground text-sm">
          Veți vedea aici notificările despre task-uri, proiecte, și alte actualizări importante.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px] pr-4">
        {unreadNotifications.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm px-1">Necitite</h3>
            {unreadNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClose={onClose}
              />
            ))}
          </div>
        )}

        {readNotifications.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="font-medium text-sm px-1 text-muted-foreground">Citite</h3>
            {readNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {notifications.length > 0 && (
        <div className="flex justify-end pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadNotifications.length === 0}
          >
            Marchează toate ca citite
          </Button>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  onClose?: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete, onClose }: NotificationItemProps) {
  const priorityColors = {
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    normal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    info: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
  };

  const getIcon = () => {
    switch (notification.type) {
      case "task_assigned":
      case "task_completed":
      case "task_deadline":
        return <Check className="h-5 w-5" />;
      case "comment_added":
        return <Info className="h-5 w-5" />;
      case "project_update":
        return <Package className="h-5 w-5" />;
      case "invoice_status":
      case "payment_received":
        return <Package className="h-5 w-5" />;
      case "team_member_added":
        return <Users className="h-5 w-5" />;
      case "system_alert":
        return <Megaphone className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ro
      });
    } catch (e) {
      return "data necunoscută";
    }
  };

  const linkToEntity = () => {
    if (onClose) onClose();
    
    // Implementarea navigării către entitatea asociată notificării
    if (notification.entity_id && notification.entity_type) {
      let url = "/";
      
      switch (notification.entity_type) {
        case "task":
          url = `/tasks/${notification.entity_id}`;
          break;
        case "project":
          url = `/projects/${notification.entity_id}`;
          break;
        case "invoice":
          url = `/invoices/${notification.entity_id}`;
          break;
        case "team_member":
          url = `/team/${notification.entity_id}`;
          break;
        default:
          url = "/dashboard";
      }
      
      window.location.href = url;
    }
  };

  // Folosim o valoare implicită pentru prioritate în caz că tipul exact nu există în mapare
  const getPriorityClass = (priority: string) => {
    return priorityColors[priority as keyof typeof priorityColors] || priorityColors.info;
  };
  
  return (
    <Card className={`relative overflow-hidden ${!notification.read_at ? 'border-l-primary border-l-4' : ''}`}>
      <div className={`absolute inset-0 w-1 ${getPriorityClass(notification.priority)}`}></div>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${getPriorityClass(notification.priority)}`}>
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="cursor-pointer" onClick={linkToEntity}>
              <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
            </div>
            
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <span>{formatTimestamp(notification.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-start space-x-1">
            <TooltipProvider>
              {!notification.read_at && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Marchează ca citit</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Marchează ca citit</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onDelete(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Șterge notificarea</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Șterge notificarea</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}