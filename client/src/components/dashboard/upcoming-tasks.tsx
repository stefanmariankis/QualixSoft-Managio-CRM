import { formatDistanceToNow, isAfter } from "date-fns";
import { ro } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, Clock, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate: Date;
  projectId: number;
  projectName: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  progress: number;
}

interface UpcomingTasksProps {
  tasks: Task[];
  isLoading?: boolean;
  maxItems?: number;
}

export function UpcomingTasks({
  tasks,
  isLoading = false,
  maxItems = 5
}: UpcomingTasksProps) {
  // Show loading state if data is loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task-uri apropiate</CardTitle>
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
                <div className="h-2 w-full bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no tasks, show a message
  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task-uri apropiate</CardTitle>
        </CardHeader>
        <CardContent className="text-center p-6">
          <div className="flex flex-col items-center gap-2">
            <FolderKanban className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="font-medium text-muted-foreground">Nu ai task-uri apropiate</h3>
            <p className="text-xs text-muted-foreground">
              Toate sarcinile tale au termene confortabile sau au fost deja finalizate.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort tasks by due date and priority
  const sortedTasks = [...tasks].sort((a, b) => {
    // First by date
    const dateCompare = a.dueDate.getTime() - b.dueDate.getTime();
    if (dateCompare !== 0) return dateCompare;
    
    // Then by priority
    const priorityWeight = {
      urgent: 3,
      high: 2,
      medium: 1,
      low: 0
    };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  // Function to get priority badge variant
  const getPriorityVariant = (priority: Task["priority"]): "default" | "destructive" | "outline" | "secondary" => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  // Function to get progress color
  const getProgressColor = (progress: number, dueDate: Date) => {
    const isOverdue = isAfter(new Date(), dueDate);
    
    if (isOverdue) return "bg-red-500";
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-amber-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Task-uri apropiate</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {sortedTasks.slice(0, maxItems).map((task) => {
              const isOverdue = isAfter(new Date(), task.dueDate);
              
              return (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge variant={getPriorityVariant(task.priority)}>
                          {task.priority === "urgent" ? "URGENT" : 
                           task.priority === "high" ? "Prioritate înaltă" :
                           task.priority === "medium" ? "Prioritate medie" : "Prioritate scăzută"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FolderKanban className="h-3 w-3" /> 
                          {task.projectName}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {isOverdue ? (
                        <span className="flex items-center text-red-500 font-medium">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Întârziat
                        </span>
                      ) : (
                        <span className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(task.dueDate, { 
                            addSuffix: true,
                            locale: ro
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progres: {task.progress}%</span>
                      <span className="text-muted-foreground">Status: {task.status}</span>
                    </div>
                    <Progress 
                      value={task.progress} 
                      className="h-1.5" 
                      indicatorClassName={getProgressColor(task.progress, task.dueDate)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}