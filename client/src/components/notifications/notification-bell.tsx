import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "./notification-list";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [animate, setAnimate] = useState(false);
  const [error, setError] = useState(false);
  const prevUnreadCountRef = useRef(0);
  
  // Funcție pentru a testa animația - simulează primirea unei notificări noi
  const triggerAnimation = () => {
    setAnimate(true);
    
    const timer = setTimeout(() => {
      setAnimate(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  };
  
  // La dublu-click pe clopoțel, declanșăm animația pentru testare
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerAnimation();
  };

  // Verifică dacă notificările sunt încărcate corect
  useEffect(() => {
    if (notifications === undefined && !isLoading) {
      setError(true);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca notificările",
        variant: "destructive",
      });
    } else {
      setError(false);
    }
  }, [notifications, isLoading, toast]);

  // Calculează numărul de notificări necitite
  const unreadCount = notifications?.filter(notification => !notification.read_at).length || 0;
  
  // Adaugă animație când crește numărul de notificări necitite
  useEffect(() => {
    if (!isLoading && unreadCount > prevUnreadCountRef.current) {
      setAnimate(true);
      
      // Oprește animația după ce s-a terminat
      const timer = setTimeout(() => {
        setAnimate(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, isLoading]);

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      // Adăugăm o mică animație când se deschide clopoțelul
      if (newOpen) {
        triggerAnimation();
      }
    }}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative cursor-pointer"
          onClick={() => {
            // Pe mobile onClick va funcționa mai bine decât onDoubleClick
            if (!open) {
              setOpen(true);
            }
          }}
          onDoubleClick={handleDoubleClick}
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
          <span className="sr-only">Arată notificările</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-4 max-w-[90vw]" // Adăugăm max-width pentru dispozitive mobile
        sideOffset={8}
      >
        <NotificationList onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}