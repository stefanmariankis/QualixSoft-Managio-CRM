import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { 
  FileBarChart2, 
  Users, 
  Briefcase, 
  Receipt, 
  CalendarCheck, 
  Clock,
  ArrowRight
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityLog, ActivityItem } from "@/components/dashboard/activity-log";
import { ProjectStatusChart, ProjectStatusData } from "@/components/dashboard/project-status-chart";
import { InvoicesChart, InvoiceChartData } from "@/components/dashboard/invoices-chart";
import { UpcomingTasks, Task } from "@/components/dashboard/upcoming-tasks";
import { TimeTrackingChart, TimeTrackingData } from "@/components/dashboard/time-tracking-chart";
import { UpcomingEvents, Event } from "@/components/dashboard/upcoming-events";
import { Button } from "@/components/ui/button";
import { 
  useActivityLog, 
  useStatistics, 
  useProjectsStatus, 
  useInvoicesData,
  useUpcomingTasks,
  useTimeTrackingData,
  useUpcomingEvents
} from "@/hooks/use-organization-data";

export default function Dashboard() {
  const { user, organization } = useAuth();
  
  // Fetch data using the custom hooks
  const { 
    data: activityLogData, 
    isLoading: isActivityLoading 
  } = useActivityLog();
  
  const { 
    data: statisticsData, 
    isLoading: isStatisticsLoading 
  } = useStatistics();
  
  const { 
    data: projectStatusData, 
    isLoading: isProjectStatusLoading 
  } = useProjectsStatus();
  
  const { 
    data: invoicesData, 
    isLoading: isInvoicesLoading 
  } = useInvoicesData();
  
  const { 
    data: tasksData, 
    isLoading: isTasksLoading 
  } = useUpcomingTasks();
  
  const { 
    data: timeTrackingData, 
    isLoading: isTimeTrackingLoading 
  } = useTimeTrackingData();
  
  const { 
    data: eventsData, 
    isLoading: isEventsLoading 
  } = useUpcomingEvents();

  // Load sample data for demonstration purposes
  // This will be replaced with real data from API endpoints
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    clientsCount: 0,
    projectsCount: 0,
    activeTasksCount: 0,
    invoicesValue: 0,
    totalRevenue: 0,
    averageProjectValue: 0,
    clientsIncrease: 0,
    projectsIncrease: 0,
    revenueIncrease: 0
  });
  const [projectStatus, setProjectStatus] = useState<ProjectStatusData[]>([]);
  const [invoiceStats, setInvoiceStats] = useState<InvoiceChartData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeData, setTimeData] = useState<TimeTrackingData[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Set fallback data when API data is unavailable
  useEffect(() => {
    // Process Statistics data
    if (statisticsData) {
      setStats(statisticsData as any);
    }
    
    // Process Activity Log data
    if (activityLogData) {
      setActivities(activityLogData as ActivityItem[]);
    }
    
    // Process Project Status data
    if (projectStatusData) {
      setProjectStatus(projectStatusData as ProjectStatusData[]);
    }
    
    // Process Invoices data
    if (invoicesData) {
      setInvoiceStats(invoicesData as InvoiceChartData[]);
    }
    
    // Process Tasks data
    if (tasksData) {
      setTasks(tasksData as Task[]);
    }
    
    // Process Time Tracking data
    if (timeTrackingData) {
      setTimeData(timeTrackingData as TimeTrackingData[]);
    }
    
    // Process Events data
    if (eventsData) {
      setEvents(eventsData as Event[]);
    }
  }, [
    statisticsData, 
    activityLogData, 
    projectStatusData, 
    invoicesData,
    tasksData,
    timeTrackingData,
    eventsData
  ]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bună dimineața";
    if (hour < 17) return "Bună ziua";
    return "Bună seara";
  };

  return (
    <DashboardLayout>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user?.first_name || 'Utilizator'}!
          </h1>
          <p className="text-muted-foreground">
            Aici este o privire de ansamblu asupra activității tale din {organization?.name || 'organizație'}.
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button size="sm" variant="outline">
            <CalendarCheck className="mr-2 h-4 w-4" />
            <span>Generează raport</span>
          </Button>
          <Button size="sm">
            <Clock className="mr-2 h-4 w-4" />
            <span>Înregistrează timp</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total clienți"
          value={stats.clientsCount}
          icon={<Users size={18} />}
          trend={stats.clientsIncrease}
          trendLabel="luna aceasta"
          description="față de luna trecută"
        />
        <StatsCard
          title="Proiecte active"
          value={stats.projectsCount}
          icon={<Briefcase size={18} />}
          trend={stats.projectsIncrease}
          trendLabel="luna aceasta"
          description="față de luna trecută"
        />
        <StatsCard
          title="Facturi emise"
          value={new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 }).format(stats.invoicesValue)}
          icon={<Receipt size={18} />}
          description={`${stats.activeTasksCount} task-uri active`}
        />
        <StatsCard
          title="Venituri totale"
          value={new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 }).format(stats.totalRevenue)}
          icon={<FileBarChart2 size={18} />}
          trend={stats.revenueIncrease}
          trendLabel="luna aceasta"
          description="față de luna trecută"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <ProjectStatusChart 
          data={projectStatus}
          isLoading={isProjectStatusLoading && !projectStatus.length}
        />
        <InvoicesChart 
          data={invoiceStats}
          isLoading={isInvoicesLoading && !invoiceStats.length}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-6">
        {/* Time Tracking Chart */}
        <div className="lg:col-span-3">
          <TimeTrackingChart 
            data={timeData}
            isLoading={isTimeTrackingLoading && !timeData.length}
          />
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ActivityLog 
            activities={activities} 
            isLoading={isActivityLoading && !activities.length}
          />
        </div>
        <div className="lg:col-span-1">
          <UpcomingTasks 
            tasks={tasks}
            isLoading={isTasksLoading && !tasks.length}
          />
        </div>
        <div className="lg:col-span-1">
          <UpcomingEvents 
            events={events}
            isLoading={isEventsLoading && !events.length}
          />
        </div>
      </div>

      {/* View More Button (Mobile Only) */}
      <div className="md:hidden mt-6">
        <Button className="w-full" variant="outline">
          <span>Vezi dashboard complet</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </DashboardLayout>
  );
}
