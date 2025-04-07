import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
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

  // Adăugăm un ref pentru a gestiona mai bine evenimente touch
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Handler pentru click manual (în loc să ne bazăm pe PopoverTrigger)
  const handleClick = () => {
    setOpen(!open);
    if (!open) {
      triggerAnimation();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div 
        className="relative cursor-pointer notification-bell-container mobile-tap-target" 
        onClick={handleClick}
        onTouchStart={() => {
          // Pentru dispozitive mobile, simulăm un eveniment de click
          if (buttonRef.current) {
            buttonRef.current.click();
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button 
            ref={buttonRef}
            variant="ghost" 
            size="icon" 
            className="relative cursor-pointer touch-manipulation w-10 h-10 sm:w-9 sm:h-9"
            onDoubleClick={handleDoubleClick}
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
            <span className="sr-only">Arată notificările</span>
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent
        align="end"
        className="w-[380px] p-4 max-w-[90vw]" // Adăugăm max-width pentru dispozitive mobile
        sideOffset={8}
        onInteractOutside={() => {
          // Închide popover-ul când se apasă în afara lui (important pentru mobile)
          setOpen(false);
        }}
      >
        <div className="relative">
          {/* Adăugăm un buton de închidere vizibil doar pe mobile */}
          <button 
            className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground sm:hidden" 
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