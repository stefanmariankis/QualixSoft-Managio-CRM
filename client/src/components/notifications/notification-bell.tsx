import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "./notification-list";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationBell() {
  const { notifications, isLoading } = useNotifications();
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

  // Funcție pentru a manipula deschiderea și închiderea popover-ului
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Declanșăm animația doar când deschidem
      triggerAnimation();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative cursor-pointer w-12 h-12 p-0 sm:w-10 sm:h-10"
          aria-label="Arată notificările"
        >
          <Bell 
            className={cn(
              "h-5 w-5 transition-all", 
              animate && "animate-bell text-primary"
            )} 
          />
          {!isLoading && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                animate && "animate-badge"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[380px] p-4 max-w-[90vw] z-50"
        align="end"
        sideOffset={8}
      >
        <div className="relative">
          {/* Buton de închidere */}
          <button 
            className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-foreground" 
            onClick={() => setOpen(false)}
            aria-label="Închide notificările"
          >
            <X className="h-4 w-4" />
          </button>
          
          <NotificationList onClose={() => setOpen(false)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}