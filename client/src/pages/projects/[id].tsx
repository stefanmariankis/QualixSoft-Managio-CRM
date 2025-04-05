import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, ArrowLeft, Building2, User, Calendar as CalendarIcon, 
  CreditCard, FileText, Clipboard, Edit, Trash2, CheckCircle2, 
  FolderKanban, Clock, XCircle, AlertCircle, PieChart, DollarSign
} from "lucide-react";
import { format, isAfter, isBefore, formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";

// Tipurile de date
type Project = {
  id: number;
  name: string;
  description: string | null;
  status: 'în progres' | 'finalizat' | 'anulat' | 'în așteptare';
  priority: 'scăzută' | 'medie' | 'ridicată' | 'urgentă';
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  client_id: number;
  client_name?: string;
  manager_id: number | null;
  manager_name?: string;
  completion_percentage: number;
  category: string;
  organization_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: 'de făcut' | 'în progres' | 'în revizuire' | 'finalizat';
  priority: 'scăzută' | 'medie' | 'ridicată' | 'urgentă';
  due_date: string | null;
  estimated_hours: number | null;
  assignee_id: number | null;
  assignee_name?: string;
  project_id: number;
  organization_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
};

type TimeLog = {
  id: number;
  task_id: number | null;
  task_title?: string;
  project_id: number;
  user_id: number;
  user_name?: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  description: string | null;
  billable: boolean;
  invoiced: boolean;
  organization_id: number;
  created_at: string;
  updated_at: string;
};

type ProjectDetailsResponse = {
  project: Project;
  tasks: Task[];
  timeLogs: TimeLog[];
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
};

export default function ProjectDetails() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Obținem detaliile proiectului
  const { data, isLoading, error } = useQuery<ProjectDetailsResponse>({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca detaliile proiectului');
      }
      
      return await response.json();
    }
  });
  
  // Mutația pentru ștergerea proiectului
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/projects/${projectId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proiect șters",
        description: "Proiectul a fost șters cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setLocation('/projects');
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge proiectul",
        variant: "destructive",
      });
    }
  });
  
  // Handle-uri pentru acțiuni
  const handleDelete = () => {
    deleteProjectMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  // Dacă se încarcă datele, afișăm un loader
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă detaliile proiectului...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  // Dacă există o eroare, o afișăm
  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Alert className="max-w-md" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Eroare</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Nu s-au putut încărca detaliile proiectului"}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => setLocation('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la lista de proiecte
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const { project, tasks, timeLogs, client } = data;
  
  // Funcție pentru formatarea datelor
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nedefinit';
    return format(new Date(dateString), 'd MMMM yyyy', { locale: ro });
  };
  
  // Calculează procentaj task-uri finalizate
  const completedTasksPercentage = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.status === 'finalizat').length / tasks.length) * 100) 
    : 0;
  
  // Calculează ore lucrate
  const totalHoursLogged = timeLogs.reduce((sum, log) => sum + log.duration_minutes / 60, 0).toFixed(1);
  
  // Verifică dacă proiectul este în întârziere
  const isOverdue = () => {
    if (!project.end_date || project.status === 'finalizat' || project.status === 'anulat') return false;
    return isAfter(new Date(), new Date(project.end_date));
  };
  
  // Culori pentru statusuri
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'în progres':
        return 'bg-blue-100 text-blue-800';
      case 'finalizat':
        return 'bg-green-100 text-green-800';
      case 'anulat':
        return 'bg-red-100 text-red-800';
      case 'în așteptare':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Culori pentru priorități
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'scăzută':
        return 'bg-blue-100 text-blue-800';
      case 'medie':
        return 'bg-yellow-100 text-yellow-800';
      case 'ridicată':
        return 'bg-orange-100 text-orange-800';
      case 'urgentă':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Culori pentru statusuri task-uri
  const getTaskStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'de făcut':
        return 'bg-gray-100 text-gray-800';
      case 'în progres':
        return 'bg-blue-100 text-blue-800';
      case 'în revizuire':
        return 'bg-purple-100 text-purple-800';
      case 'finalizat':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Funcție pentru a verifica dacă un task este în întârziere
  const isTaskOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'finalizat') return false;
    return isAfter(new Date(), new Date(dueDate));
  };
  
  // Inițiale pentru avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Header cu butoane de acțiune */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setLocation('/projects')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="mr-2">{project.name}</span>
                <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              </h1>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>Client: <Link href={`/clients/${client.id}`} className="hover:underline">{client.name}</Link></span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/projects/edit/${project.id}`}>
                <Edit className="mr-2 h-4 w-4" /> Editează
              </Link>
            </Button>
            
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Șterge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmă ștergerea</DialogTitle>
                  <DialogDescription>
                    Sunteți sigur că doriți să ștergeți proiectul {project.name}? Această acțiune este ireversibilă.
                    {tasks.length > 0 && (
                      <Alert className="mt-4" variant="warning">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atenție</AlertTitle>
                        <AlertDescription>
                          Acest proiect are {tasks.length} task-uri asociate. Acestea vor fi șterse odată cu proiectul.
                        </AlertDescription>
                      </Alert>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Anulează
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteProjectMutation.isPending}
                  >
                    {deleteProjectMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Șterge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Sumar proiect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Perioadă</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">
                {formatDate(project.start_date)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center mt-1">
                <span>până la</span>
                <span className={`ml-1 ${isOverdue() ? 'text-red-600 font-medium' : ''}`}>
                  {formatDate(project.end_date)}
                </span>
              </div>
              {isOverdue() && (
                <div className="text-xs text-red-600 mt-1">
                  Întârziat cu {formatDistanceToNow(new Date(project.end_date || ''), { locale: ro })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <PieChart className="h-4 w-4" />
                  <span>Progres</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">
                {project.completion_percentage}%
              </div>
              <div className="mt-2">
                <Progress value={project.completion_percentage} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {tasks.filter(t => t.status === 'finalizat').length} din {tasks.length} task-uri finalizate
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Timp lucrat</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">
                {totalHoursLogged} ore
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {timeLogs.length} înregistrări
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {timeLogs.filter(l => l.billable).reduce((sum, log) => sum + log.duration_minutes / 60, 0).toFixed(1)} ore facturabile
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Buget</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">
                {project.budget ? `${project.budget.toLocaleString('ro-RO')} RON` : 'Nespecificat'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <Badge variant="outline" className={getPriorityColor(project.priority)}>{project.priority}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span>Categorie: {project.category}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs cu informații detaliate */}
        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Detalii</TabsTrigger>
            <TabsTrigger value="tasks">Task-uri ({tasks.length})</TabsTrigger>
            <TabsTrigger value="time">Timp ({timeLogs.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Descriere proiect</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description ? (
                    <div className="text-sm whitespace-pre-line">
                      {project.description}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Nicio descriere disponibilă pentru acest proiect.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Informații</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Manager proiect</h3>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {project.manager_name ? getInitials(project.manager_name) : 'N/A'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{project.manager_name || 'Nealocat'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/clients/${client.id}`} className="text-sm hover:underline">
                        {client.name}
                      </Link>
                    </div>
                    {client.email && (
                      <div className="flex items-center space-x-2 pl-6">
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center space-x-2 pl-6">
                        <span className="text-xs text-muted-foreground">{client.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Date creare</h3>
                    <div className="flex flex-col space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>Creat: {formatDate(project.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Actualizat: {formatDate(project.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Task-uri</h2>
              <Button asChild>
                <Link href={`/tasks/new?projectId=${project.id}`}>
                  <PieChart className="mr-2 h-4 w-4" /> Adaugă task
                </Link>
              </Button>
            </div>
            
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clipboard className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-center text-muted-foreground">Nu există task-uri pentru acest proiect.</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/tasks/new?projectId=${project.id}`}>
                      Adaugă primul task
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titlu</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioritate</TableHead>
                      <TableHead>Responsabil</TableHead>
                      <TableHead>Termen</TableHead>
                      <TableHead>Timp estimat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <Link href={`/tasks/${task.id}`} className="hover:underline">
                            {task.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTaskStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {task.assignee_name ? (
                              <>
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {getInitials(task.assignee_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{task.assignee_name}</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Nealocat</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={isTaskOverdue(task.due_date, task.status) ? "text-red-600" : ""}>
                            {task.due_date ? formatDate(task.due_date) : 'Nedefinit'}
                            {isTaskOverdue(task.due_date, task.status) && (
                              <div className="text-xs text-red-600">Întârziat</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.estimated_hours ? `${task.estimated_hours} ore` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="time" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Timp înregistrat</h2>
              <Button asChild>
                <Link href={`/time-logs/new?projectId=${project.id}`}>
                  <Clock className="mr-2 h-4 w-4" /> Adaugă timp
                </Link>
              </Button>
            </div>
            
            {timeLogs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-center text-muted-foreground">Nu există înregistrări de timp pentru acest proiect.</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/time-logs/new?projectId=${project.id}`}>
                      Adaugă prima înregistrare
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dată</TableHead>
                      <TableHead>Utilizator</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Durată</TableHead>
                      <TableHead>Descriere</TableHead>
                      <TableHead>Facturabil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {formatDate(log.start_time)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {log.user_name ? getInitials(log.user_name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{log.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.task_title ? (
                            <Link href={`/tasks/${log.task_id}`} className="text-sm hover:underline">
                              {log.task_title}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">Fără task</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(log.duration_minutes / 60).toFixed(1)} ore
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={log.description || ''}>
                            {log.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.billable ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}