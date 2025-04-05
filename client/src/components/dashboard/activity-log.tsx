import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ro } from "date-fns/locale";

export interface ActivityItem {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  userInitials: string;
  actionType: string;
  actionDescription: string;
  entityType: string;
  entityId: number;
  entityName: string;
  timestamp: Date;
}

interface ActivityLogProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  maxItems?: number;
}

export function ActivityLog({
  activities,
  isLoading = false,
  maxItems = 10
}: ActivityLogProps) {
  // Show loading state if data is loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activitate recentă</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                  <div className="h-3 w-64 animate-pulse rounded bg-muted"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Function to get badge variant based on action type
  const getBadgeVariant = (actionType: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (actionType) {
      case "adăugare":
        return "default";
      case "modificare":
        return "secondary";
      case "ștergere":
        return "destructive";
      case "atribuire":
        return "secondary";
      case "finalizare":
        return "default";
      default:
        return "outline";
    }
  };

  // Get entity type display name
  const getEntityTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      "client": "client",
      "project": "proiect",
      "task": "sarcină",
      "invoice": "factură",
      "payment": "plată",
      "document": "document",
      "team": "echipă",
      "comment": "comentariu"
    };
    
    return types[type] || type;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Activitate recentă</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {activities.slice(0, maxItems).map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                  <AvatarFallback>{activity.userInitials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">
                      {activity.userName}
                    </p>
                    <Badge variant={getBadgeVariant(activity.actionType)}>
                      {activity.actionType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, { 
                        addSuffix: true,
                        locale: ro
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.actionDescription}{" "}
                    <span className="font-medium text-foreground">
                      {getEntityTypeDisplay(activity.entityType)} {activity.entityName}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}