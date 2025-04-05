import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  description?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendLabel,
  description,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("h-full transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="text-2xl font-bold">{value}</div>
          
          {(trend !== undefined || description) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {trend !== undefined && (
                <span className={cn(
                  "inline-flex items-center mr-1 font-medium",
                  trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500"
                )}>
                  {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} 
                  {Math.abs(trend)}% {trendLabel || ''}
                </span>
              )}
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}