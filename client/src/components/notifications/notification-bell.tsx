import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "./notification-list";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function NotificationBell() {
  const { notifications, isLoading, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [animate, setAnimate] = useState(false);
  const prevUnreadCountRef = useRef(0);
  
  // Funcție pentru a declanșa animația clopoțelului
  const triggerAnimation = () => {
    setAnimate(true);
    setTimeout(() => {
      setAnimate(false);
    }, 1000);
  };

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
  
  // Handler pentru a șterge toate notificările - implementare simplificată
  const handleDeleteAll = () => {
    toast({
      title: "Acțiune temporar indisponibilă",
      description: "Ștergerea în masă va fi implementată în curând",
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative cursor-pointer w-14 h-14 p-0 sm:w-12 sm:h-12 rounded-full hover:bg-accent active:scale-95 transition-all" 
          onClick={(e) => {
            // Important! Acest lucru împiedică butonul să declanșeze evenimentul de click de două ori
            e.preventDefault();
            if (!open) {
              triggerAnimation();
              setOpen(true);
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
      </SheetTrigger>
      
      <SheetContent side="right" className="sm:max-w-[500px] w-[90vw] overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center justify-between">
            <span>Notificări</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="ml-2">
                {unreadCount} necitite
              </Badge>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <Separator className="my-2" />
        
        <div className="flex-1 overflow-hidden px-6">
          <NotificationList onClose={() => setOpen(false)} />
        </div>
        
        <Separator className="my-2" />
        
        <SheetFooter className="flex justify-between items-center px-6 py-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDeleteAll}
            disabled={!notifications?.length}
            className="flex items-center"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Șterge toate</span>
            <span className="sm:hidden">Șterge</span>
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center"
          >
            <Check className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Marchează ca citite</span>
            <span className="sm:hidden">Citite</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}