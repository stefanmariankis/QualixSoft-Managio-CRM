import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Calendar, Clock, MapPin } from "lucide-react";

export interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  type: "meeting" | "deadline" | "payment" | "reminder" | "other";
  isAllDay?: boolean;
}

interface UpcomingEventsProps {
  events: Event[];
  isLoading?: boolean;
  maxItems?: number;
}

export function UpcomingEvents({
  events,
  isLoading = false,
  maxItems = 5
}: UpcomingEventsProps) {
  // Show loading state if data is loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evenimente apropiate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex justify-between">
                  <div className="h-5 w-32 bg-muted rounded"></div>
                  <div className="h-5 w-20 bg-muted rounded"></div>
                </div>
                <div className="h-4 w-full bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no events, show a message
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evenimente apropiate</CardTitle>
        </CardHeader>
        <CardContent className="text-center p-6">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="font-medium text-muted-foreground">Nu ai evenimente apropiate</h3>
            <p className="text-xs text-muted-foreground">
              Nu există întâlniri, termene limită sau alte evenimente programate în perioada următoare.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure we're working with Date objects
  const ensureDate = (dateInput: any): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    
    try {
      // Try to convert string to Date
      const date = new Date(dateInput);
      
      // Verificăm dacă data este validă
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date;
    } catch (error) {
      return null;
    }
  };

  // Sort events by start date
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = ensureDate(a.startDate);
    const dateB = ensureDate(b.startDate);
    
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });

  // Get event type badge
  const getEventBadge = (type: Event["type"]) => {
    const styles = {
      meeting: { variant: "secondary", label: "Întâlnire" },
      deadline: { variant: "destructive", label: "Termen limită" },
      payment: { variant: "success", label: "Plată" },
      reminder: { variant: "warning", label: "Reminder" },
      other: { variant: "outline", label: "Altele" },
    };
    
    return (
      <Badge variant={styles[type].variant as any}>
        {styles[type].label}
      </Badge>
    );
  };

  // Format the event time
  const formatEventTime = (event: Event) => {
    if (event.isAllDay) {
      return "Toată ziua";
    }
    
    const startDate = ensureDate(event.startDate);
    if (!startDate) return "Oră nedefinită";
    
    const startTime = format(startDate, "HH:mm");
    if (!event.endDate) {
      return startTime;
    }
    
    const endDate = ensureDate(event.endDate);
    if (!endDate) return startTime;
    
    const endTime = format(endDate, "HH:mm");
    return `${startTime} - ${endTime}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Evenimente apropiate</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {sortedEvents.slice(0, maxItems).map((event) => (
              <div key={event.id} className="space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{event.title}</h3>
                      {getEventBadge(event.type)}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3.5 w-3.5" />
                    {ensureDate(event.startDate) 
                      ? format(ensureDate(event.startDate) as Date, "EEEE, d MMMM", { locale: ro })
                      : "Dată nedefinită"
                    }
                  </span>
                  
                  <span className="flex items-center">
                    <Clock className="mr-1 h-3.5 w-3.5" />
                    {formatEventTime(event)}
                  </span>
                  
                  {event.location && (
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}