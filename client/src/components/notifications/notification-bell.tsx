import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "./notification-list";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function NotificationBell() {
  const { notifications, isLoading, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [animate, setAnimate] = useState(false);
  const prevUnreadCountRef = useRef(0);
  
  // Funcție pentru a declanșa animația clopoțelului
  const triggerAnimation = () => {
    setAnimate(true);
    const timer = setTimeout(() => {
      setAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  };

  // Verifică dacă notificările sunt încărcate corect
  useEffect(() => {
    if (notifications === undefined && !isLoading) {
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca notificările",
        variant: "destructive",
      });
    }
  }, [notifications, isLoading, toast]);

  // Calculează numărul de notificări necitite
  const unreadCount = notifications?.filter(notification => !notification.read_at).length || 0;
  
  // Adaugă animație când crește numărul de notificări necitite
  useEffect(() => {
    if (!isLoading && unreadCount > prevUnreadCountRef.current) {
      triggerAnimation();
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, isLoading]);

  // Handler pentru a marca toate notificările ca citite
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  // Handler pentru a șterge toate notificările
  const handleDeleteAll = () => {
    if (notifications && notifications.length > 0) {
      deleteAllNotifications();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative cursor-pointer w-14 h-14 p-0 sm:w-12 sm:h-12 rounded-full hover:bg-accent active:scale-95 transition-all" 
          onClick={() => {
            if (!open) {
              triggerAnimation();
            }
          }}
          aria-label="Arată notificările"
        >
          <Bell 
            className={cn(
              "h-6 w-6 transition-all",
              animate && "animate-bell text-primary"
            )}
          />
          {!isLoading && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs",
                animate && "animate-badge"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Notificări</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="ml-2">
                {unreadCount} necitite
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Separator className="my-2" />
        
        <div className="flex-1 overflow-hidden">
          <NotificationList onClose={() => setOpen(false)} />
        </div>
        
        <Separator className="my-2" />
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDeleteAll}
              disabled={notifications?.length === 0}
              className="flex items-center"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Șterge toate</span>
              <span className="sm:hidden">Șterge</span>
            </Button>
          </div>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center"
          >
            <Check className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Marchează toate ca citite</span>
            <span className="sm:hidden">Citite</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}