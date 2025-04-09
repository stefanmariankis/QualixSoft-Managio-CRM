import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon2 } from "lucide-react";
import { Task } from "@shared/schema";

// Tipuri
interface CalendarEvent {
  id: number;
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  allDay: boolean;
  type: "task" | "meeting" | "deadline" | "reminder";
  projectId?: number | null;
  taskId?: number | null;
  color: string;
}

// Helper pentru a crea o matrice de date pentru calendar
const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Începutul grid-ului (de la prima zi a săptămânii care conține prima zi a lunii)
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
  // Sfârșitul grid-ului (până la ultima zi a săptămânii care conține ultima zi a lunii)
  const endDate = new Date(lastDay);
  const daysToAdd = 6 - lastDay.getDay();
  endDate.setDate(lastDay.getDate() + daysToAdd);
  
  const days = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Grupează zilele în săptămâni
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  
  return weeks;
};

// Verifică dacă o dată este în luna curentă
const isInCurrentMonth = (date: Date, currentMonth: number) => {
  return date.getMonth() === currentMonth;
};

// Generator evenimente de test
const generateEvents = (taskData: Task[]): CalendarEvent[] => {
  // Convertim task-urile în evenimente de calendar
  const taskEvents = taskData.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    startDate: task.due_date || new Date(),
    endDate: null,
    allDay: true,
    type: "task" as const,
    projectId: task.project_id,
    taskId: task.id,
    color: getPriorityColor(task.priority)
  }));
  
  // Adăugăm câteva evenimente de meeting
  const meetings: CalendarEvent[] = [
    {
      id: 1001,
      title: "Ședință de planificare",
      description: "Planificare sprint luna viitoare",
      startDate: new Date(new Date().setHours(10, 0, 0, 0)),
      endDate: new Date(new Date().setHours(11, 30, 0, 0)),
      allDay: false,
      type: "meeting",
      color: "#3b82f6"
    },
    {
      id: 1002,
      title: "Prezentare proiect client",
      description: "Prezentare progres proiect website",
      startDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      allDay: true,
      type: "meeting",
      projectId: 2,
      color: "#3b82f6"
    },
    {
      id: 1003,
      title: "Call echipă dezvoltare",
      description: "Actualizări săptămânale proiect",
      startDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      allDay: false,
      type: "meeting",
      projectId: 3,
      color: "#3b82f6"
    }
  ];
  
  // Adăugăm câteva deadline-uri
  const deadlines: CalendarEvent[] = [
    {
      id: 2001,
      title: "Deadline proiect e-commerce",
      description: "Finalizare fază 1 a proiectului",
      startDate: new Date(new Date().setDate(new Date().getDate() + 10)),
      endDate: null,
      allDay: true,
      type: "deadline",
      projectId: 1,
      color: "#ef4444"
    },
    {
      id: 2002,
      title: "Închidere raportare lunară",
      description: null,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 28),
      endDate: null,
      allDay: true,
      type: "deadline",
      color: "#ef4444"
    }
  ];
  
  // Adăugăm câteva remindere
  const reminders: CalendarEvent[] = [
    {
      id: 3001,
      title: "Reînnoire licențe software",
      description: null,
      startDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      endDate: null,
      allDay: true,
      type: "reminder",
      color: "#f97316"
    }
  ];
  
  return [...taskEvents, ...meetings, ...deadlines, ...reminders];
};

// Obține culoare în funcție de prioritate
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#22c55e';
    default:
      return '#6b7280';
  }
}

// Obține stilizare în funcție de tipul evenimentului
function getEventStyle(event: CalendarEvent): string {
  const baseStyle = "px-2 py-1 rounded-md text-xs truncate";
  
  switch (event.type) {
    case 'task':
      return `${baseStyle} border-l-4 bg-opacity-10 bg-neutral-100`;
    case 'meeting':
      return `${baseStyle} border-l-4 bg-blue-50 bg-opacity-20`;
    case 'deadline':
      return `${baseStyle} border-l-4 bg-red-50 bg-opacity-20`;
    case 'reminder':
      return `${baseStyle} border-l-4 bg-orange-50 bg-opacity-20`;
    default:
      return baseStyle;
  }
}

// Formator dată
function formatDate(date: Date): string {
  return date.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Formator oră
function formatTime(date: Date): string {
  return date.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Componenta principală
export default function CalendarPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Simulăm apel API pentru a obține taskurile
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      // În implementarea reală, de înlocuit cu apelul API real
      const fakeTasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        organization_id: 1,
        project_id: Math.floor(Math.random() * 5) + 1,
        title: `Task ${i + 1}`,
        description: i % 3 === 0 ? `Descriere pentru task ${i + 1}` : null,
        status: ['neînceput', 'în lucru', 'în verificare', 'finalizat'][i % 4] as any,
        priority: ['low', 'medium', 'high', 'urgent'][i % 4] as any,
        assigned_to: Math.floor(Math.random() * 3) + 1,
        created_by: 1,
        start_date: new Date(viewDate.getFullYear(), viewDate.getMonth(), Math.floor(Math.random() * 28) + 1),
        due_date: new Date(viewDate.getFullYear(), viewDate.getMonth(), Math.floor(Math.random() * 28) + 1),
        estimated_hours: Math.floor(Math.random() * 10) + 1,
        completion_percentage: Math.floor(Math.random() * 100),
        parent_task_id: i % 10 === 0 ? i : null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      return new Promise<Task[]>((resolve) => {
        setTimeout(() => resolve(fakeTasks), 300);
      });
    },
  });
  
  // Generăm evenimente
  const events = tasks ? generateEvents(tasks) : [];
  
  // Filtrăm evenimentele pentru data selectată
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Obține evenimente pentru data selectată
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  // Pentru calendar lunar
  const weeks = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  
  // Funcții de navigare calendar
  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setViewDate(new Date());
    setSelectedDate(new Date());
  };
  
  // Formatare lună și an
  const formattedMonthYear = viewDate.toLocaleDateString('ro-RO', {
    month: 'long',
    year: 'numeric'
  });

  // Zilele săptămânii
  const weekdays = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  
  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              Planifică și vizualizează evenimente, întâlniri și termene limită
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={goToToday}>
              Astăzi
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Eveniment nou
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adaugă eveniment nou</DialogTitle>
                  <DialogDescription>
                    Completează detaliile pentru a adăuga un nou eveniment în calendar
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Titlu</label>
                    <Input id="title" placeholder="Titlu eveniment" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="start_date" className="text-sm font-medium">Data început</label>
                      <div className="flex items-center">
                        <Input id="start_date" type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="end_date" className="text-sm font-medium">Data sfârșit</label>
                      <div className="flex items-center">
                        <Input id="end_date" type="date" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="start_time" className="text-sm font-medium">Ora început</label>
                      <Input id="start_time" type="time" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="end_time" className="text-sm font-medium">Ora sfârșit</label>
                      <Input id="end_time" type="time" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-medium">Tip eveniment</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează tipul" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Întâlnire</SelectItem>
                        <SelectItem value="task">Sarcină</SelectItem>
                        <SelectItem value="deadline">Termen limită</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Descriere</label>
                    <Textarea id="description" placeholder="Descriere eveniment" rows={3} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium mb-1 inline-block">
                      <input 
                        type="checkbox" 
                        className="mr-2 rounded border-gray-300"
                      />
                      Eveniment pe tot parcursul zilei
                    </label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline">Anulează</Button>
                  <Button>Salvează eveniment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="mb-6 flex items-center">
          <div className="flex-1">
            <div className="flex items-center">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="mx-4 text-xl font-semibold capitalize">
                {formattedMonthYear}
              </h2>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Select
              value={currentView}
              onValueChange={(value) => setCurrentView(value as 'month' | 'week' | 'day')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Vedere lunară</SelectItem>
                <SelectItem value="week">Vedere săptămânală</SelectItem>
                <SelectItem value="day">Vedere zilnică</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_350px]">
          <Card>
            <CardContent className="p-0">
              {currentView === 'month' && (
                <div className="grid grid-cols-7 border-b">
                  {weekdays.map((day, index) => (
                    <div
                      key={index}
                      className="p-3 text-center text-sm font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>
              )}
              
              {currentView === 'month' && (
                <div className="grid grid-cols-7 grid-rows-[auto]">
                  {weeks.flat().map((date, i) => {
                    const isToday = date.toDateString() === today.toDateString();
                    const isInMonth = isInCurrentMonth(date, viewDate.getMonth());
                    const isSelected = selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
                    const dateEvents = getEventsForDate(date);
                    
                    return (
                      <div
                        key={i}
                        className={`min-h-[120px] relative border p-1 ${
                          !isInMonth ? "bg-muted/50" : ""
                        } ${isToday ? "bg-accent/10" : ""} ${
                          isSelected ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="flex h-full flex-col">
                          <div className={`mb-1 flex h-8 items-center ${
                            isToday ? "font-bold text-primary" : !isInMonth ? "text-muted-foreground" : ""
                          }`}>
                            {date.getDate()}
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-1">
                            {dateEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className={getEventStyle(event)}
                                style={{ borderLeftColor: event.color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                }}
                              >
                                {!event.allDay && (
                                  <time className="mr-1 text-[10px] font-medium">
                                    {formatTime(event.startDate)}
                                  </time>
                                )}
                                {event.title}
                              </div>
                            ))}
                            {dateEvents.length > 3 && (
                              <div className="px-2 text-xs text-muted-foreground">
                                + încă {dateEvents.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div>
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle>
                  {selectedDate
                    ? formatDate(selectedDate)
                    : "Selectează o dată"}
                </CardTitle>
                <CardDescription>
                  {selectedDateEvents.length} evenimente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Niciun eveniment planificat pentru această zi.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="space-y-1 border-l-2 p-2 hover:bg-accent/5 transition-colors cursor-pointer"
                        style={{ borderLeftColor: event.color }}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{event.title}</div>
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {{
                              task: "sarcină",
                              meeting: "întâlnire",
                              deadline: "termen limită",
                              reminder: "reminder",
                            }[event.type]}
                          </Badge>
                        </div>
                        {!event.allDay && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <div>
                              {formatTime(event.startDate)}
                              {event.endDate &&
                                ` - ${formatTime(event.endDate)}`}
                            </div>
                          </div>
                        )}
                        {event.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {event.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {selectedEvent && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedEvent.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className="capitalize"
                    >
                      {{
                        task: "sarcină",
                        meeting: "întâlnire",
                        deadline: "termen limită",
                        reminder: "reminder",
                      }[selectedEvent.type]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <CalendarIcon2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Data</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(selectedEvent.startDate)}
                          {selectedEvent.endDate && selectedEvent.endDate.toDateString() !== selectedEvent.startDate.toDateString() && (
                            ` - ${formatDate(selectedEvent.endDate)}`
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!selectedEvent.allDay && (
                      <div className="flex items-start space-x-2">
                        <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Ora</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(selectedEvent.startDate)}
                            {selectedEvent.endDate &&
                              ` - ${formatTime(selectedEvent.endDate)}`}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedEvent.description && (
                      <div>
                        <div className="font-medium">Descriere</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {selectedEvent.description}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                        Închide
                      </Button>
                      <Button size="sm">Editează</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}