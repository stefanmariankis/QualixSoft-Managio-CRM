import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "./notification-list";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import { Card } from "@/components/ui/card";

export function NotificationBell() {
  const { notifications, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [animate, setAnimate] = useState(false);
  const [error, setError] = useState(false);
  const prevUnreadCountRef = useRef(0);
  
  // Container pentru dropdown-ul de notificări
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ref pentru butonul de clopoțel
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  
  // Hook pentru a detecta click-uri în afara componentei
  useOnClickOutside(containerRef, (event: MouseEvent | TouchEvent) => {
    // Nu închide dacă click-ul a fost pe butonul de clopoțel
    if (bellButtonRef.current && bellButtonRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  });
  
  // Funcție pentru a testa animația - simulează primirea unei notificări noi
  const triggerAnimation = () => {
    setAnimate(true);
    
    const timer = setTimeout(() => {
      setAnimate(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  };
  
  // Func handler pentru click pe clopoțel
  const handleBellClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
    
    if (!open) {
      triggerAnimation();
    }
  };
  
  // La dublu-click pe clopoțel, declanșăm doar animația
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
    <div className="relative" ref={containerRef}>
      {/* Butonul de clopoțel */}
      <Button 
        ref={bellButtonRef}
        variant="ghost" 
        size="icon" 
        className="relative cursor-pointer touch-manipulation w-10 h-10 sm:w-9 sm:h-9" 
        onClick={handleBellClick}
        onTouchStart={(e) => {
          // Pentru dispozitive mobile, asigu0ă-te că event-ul de click este declanșat
          // Acest lucru ajută pe unele dispozitive mobile care au probleme cu evenimentele normale
          e.currentTarget.click();
        }}
        onDoubleClick={handleDoubleClick}
        aria-label="Arată notificările"
        aria-expanded={open}
        aria-haspopup="true"
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
      
      {/* Dropdown-ul de notificări */}
      {open && (
        <Card className="absolute right-0 mt-2 w-[380px] max-w-[90vw] max-h-[80vh] overflow-hidden z-50 shadow-lg">
          <div className="relative p-4">
            {/* Buton de închidere */}
            <button 
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground" 
              onClick={() => setOpen(false)}
              aria-label="Închide notificările"
            >
              <X className="h-4 w-4" />
            </button>
            
            <NotificationList onClose={() => setOpen(false)} />
          </div>
        </Card>
      )}
    </div>
  );
}