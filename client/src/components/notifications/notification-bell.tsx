import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "./notification-list";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
  const { notifications, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {!isLoading && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Arată notificările</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-4"
        sideOffset={8}
      >
        <NotificationList onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}