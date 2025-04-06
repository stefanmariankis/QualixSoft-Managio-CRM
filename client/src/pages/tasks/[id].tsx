import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, ArrowLeft, Calendar as CalendarIcon, 
  Clock, FileText, Edit, Trash2, CheckCircle2, 
  AlertCircle, Play, Pause, FolderKanban, User, MessageSquare
} from "lucide-react";
import { format, formatDistanceToNow, isAfter } from 'date-fns';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tipurile de date
type Task = {
  id: number;
  title: string;
  description: string | null;
  status: 'de făcut' | 'în progres' | 'în revizuire' | 'finalizat';
  priority: 'scăzută' | 'medie' | 'ridicată' | 'urgentă';
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  assignee_id: number | null;
  assignee_name?: string;
  project_id: number;
  project_name?: string;
  organization_id: number;
  completion_percentage: number;
  created_by: number;
  created_at: string;
  updated_at: string;
};

type TimeLog = {
  id: number;
  task_id: number | null;
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

type Comment = {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type Attachment = {
  id: number;
  task_id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
};

type TaskDetailsResponse = {
  task: Task;
  timeLogs: TimeLog[];
  comments: Comment[];
  attachments: Attachment[];
  project: {
    id: number;
    name: string;
    client_id: number;
    client_name: string;
  };
};

export default function TaskDetails() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const taskId = parseInt(params.id);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [trackingActive, setTrackingActive] = useState(false);
  const [activeTimeLogId, setActiveTimeLogId] = useState<number | null>(null);
  
  // Obținem detaliile task-ului
  const { data, isLoading, error } = useQuery<TaskDetailsResponse>({
    queryKey: ['/api/tasks', taskId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/tasks/${taskId}`);
        
        if (!response.ok) {
          throw new Error('Nu s-au putut încărca detaliile task-ului');
        }
        
        return await response.json();
      } catch (err) {
        console.error('Eroare la încărcarea task-ului:', err);
        throw new Error('Nu s-au putut încărca detaliile task-ului');
      }
    }
  });
  
  // Mutația pentru ștergerea task-ului
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/tasks/${taskId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task șters",
        description: "Task-ul a fost șters cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', data?.task.project_id] });
      setLocation('/tasks');
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge task-ul",
        variant: "destructive",
      });
    }
  });
  
  // Mutația pentru adăugarea unui comentariu
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/tasks/${taskId}/comments`, { content });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comentariu adăugat",
        description: "Comentariul a fost adăugat cu succes",
      });
      setCommentContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut adăuga comentariul",
        variant: "destructive",
      });
    }
  });
  
  // Mutația pentru începerea timekeeping-ului
  const startTimeTrackingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/time-logs`, { 
        task_id: taskId,
        project_id: data?.task.project_id,
        description: `Lucru la task: ${data?.task.title}`
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cronometrare pornită",
        description: "Cronometrarea timpului a început",
      });
      setTrackingActive(true);
      setActiveTimeLogId(data.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut porni cronometrarea",
        variant: "destructive",
      });
    }
  });
  
  // Mutația pentru oprirea timekeeping-ului
  const stopTimeTrackingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/time-logs/${activeTimeLogId}`, { 
        end_time: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cronometrare oprită",
        description: "Cronometrarea timpului s-a oprit",
      });
      setTrackingActive(false);
      setActiveTimeLogId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut opri cronometrarea",
        variant: "destructive",
      });
    }
  });
  
  // Mutația pentru actualizarea statusului
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status actualizat",
        description: "Statusul task-ului a fost actualizat",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', data?.task.project_id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza statusul",
        variant: "destructive",
      });
    }
  });
  
  // Handle-uri pentru acțiuni
  const handleDelete = () => {
    deleteTaskMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim()) {
      addCommentMutation.mutate(commentContent);
    }
  };
  
  const handleTimeTracking = () => {
    if (trackingActive) {
      stopTimeTrackingMutation.mutate();
    } else {
      startTimeTrackingMutation.mutate();
    }
  };
  
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };
  
  // Dacă se încarcă datele, afișăm un loader
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă detaliile task-ului...</p>
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
              {error instanceof Error ? error.message : "Nu s-au putut încărca detaliile task-ului"}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => setLocation('/tasks')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la lista de task-uri
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const { task, timeLogs, comments, attachments, project } = data;
  
  // Funcție pentru formatarea datelor
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nedefinit';
    return format(new Date(dateString), 'd MMMM yyyy', { locale: ro });
  };
  
  // Calculează timpul total înregistrat
  const totalHoursLogged = timeLogs.reduce((sum, log) => sum + log.duration_minutes / 60, 0).toFixed(1);
  
  // Verifică dacă task-ul este întârziat
  const isOverdue = () => {
    if (!task.due_date || task.status === 'finalizat') return false;
    return isAfter(new Date(), new Date(task.due_date));
  };
  
  // Culori pentru statusuri
  const getStatusColor = (status: string) => {
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
  
  // Inițiale pentru avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Format pentru mărimea fișierului
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
              onClick={() => setLocation('/tasks')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="mr-2">{task.title}</span>
                <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
              </h1>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>
                  Proiect: <Link href={`/projects/${project.id}`} className="hover:underline">{project.name}</Link>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={trackingActive ? "destructive" : "secondary"} 
              onClick={handleTimeTracking}
              disabled={startTimeTrackingMutation.isPending || stopTimeTrackingMutation.isPending}
            >
              {trackingActive ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Oprește timp
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Pornește timp
                </>
              )}
            </Button>
            
            <Button variant="outline" asChild>
              <Link href={`/tasks/edit/${task.id}`}>
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
                    Sunteți sigur că doriți să ștergeți task-ul {task.title}? Această acțiune este ireversibilă.
                    {timeLogs.length > 0 && (
                      <Alert className="mt-4" variant="warning">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atenție</AlertTitle>
                        <AlertDescription>
                          Acest task are {timeLogs.length} înregistrări de timp asociate.
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
                    disabled={deleteTaskMutation.isPending}
                  >
                    {deleteTaskMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Șterge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Butoane de schimbare status */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            className={`bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer px-3 py-1 ${task.status === 'de făcut' ? 'ring-2 ring-gray-400' : ''}`}
            onClick={() => handleStatusChange('de făcut')}
          >
            De făcut
          </Badge>
          <Badge 
            className={`bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer px-3 py-1 ${task.status === 'în progres' ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => handleStatusChange('în progres')}
          >
            În progres
          </Badge>
          <Badge 
            className={`bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer px-3 py-1 ${task.status === 'în revizuire' ? 'ring-2 ring-purple-400' : ''}`}
            onClick={() => handleStatusChange('în revizuire')}
          >
            În revizuire
          </Badge>
          <Badge 
            className={`bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer px-3 py-1 ${task.status === 'finalizat' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => handleStatusChange('finalizat')}
          >
            Finalizat
          </Badge>
        </div>
        
        {/* Sumar task */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Termen limită</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className={`text-xl font-bold ${isOverdue() ? 'text-red-600' : ''}`}>
                {formatDate(task.due_date)}
              </div>
              {task.start_date && (
                <div className="text-sm text-muted-foreground mt-1">
                  Început la: {formatDate(task.start_date)}
                </div>
              )}
              {isOverdue() && (
                <div className="text-xs text-red-600 mt-1">
                  Întârziat cu {formatDistanceToNow(new Date(task.due_date || ''), { locale: ro })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Responsabil</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              {task.assignee_name ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(task.assignee_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-lg font-semibold">{task.assignee_name}</div>
                </div>
              ) : (
                <div className="text-lg font-semibold text-muted-foreground">Nealocat</div>
              )}
              <div className="flex mt-2 items-center">
                <Badge variant="outline" className={getPriorityColor(task.priority)}>{task.priority}</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Timp</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-xl font-bold">
                {totalHoursLogged} / {task.estimated_hours || '?'} ore
              </div>
              <div className="mt-2">
                <Progress 
                  value={task.estimated_hours ? (parseFloat(totalHoursLogged) / task.estimated_hours) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {timeLogs.length} înregistrări de timp
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs cu informații detaliate */}
        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Detalii</TabsTrigger>
            <TabsTrigger value="time">Timp ({timeLogs.length})</TabsTrigger>
            <TabsTrigger value="comments">Comentarii ({comments.length})</TabsTrigger>
            <TabsTrigger value="attachments">Atașamente ({attachments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Descriere task</CardTitle>
              </CardHeader>
              <CardContent>
                {task.description ? (
                  <div className="text-sm whitespace-pre-line">
                    {task.description}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    Nicio descriere disponibilă pentru acest task.
                  </div>
                )}
                <div className="mt-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Creat la: {formatDate(task.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Ultima actualizare: {formatDate(task.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="time" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Timp înregistrat</h2>
              <Button 
                variant={trackingActive ? "destructive" : "default"} 
                onClick={handleTimeTracking}
                disabled={startTimeTrackingMutation.isPending || stopTimeTrackingMutation.isPending}
              >
                {trackingActive ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Oprește timp
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Pornește timp
                  </>
                )}
              </Button>
            </div>
            
            {timeLogs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-center text-muted-foreground">Nu există înregistrări de timp pentru acest task.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => startTimeTrackingMutation.mutate()}
                    disabled={startTimeTrackingMutation.isPending}
                  >
                    {startTimeTrackingMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Începe să înregistrezi timp
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
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="comments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Comentarii</CardTitle>
              </CardHeader>
              <CardContent>
                {comments.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    Nu există comentarii pentru acest task.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 pb-4 border-b">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getInitials(comment.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between mb-1">
                            <h4 className="font-medium">{comment.user_name}</h4>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'd MMM yyyy, HH:mm', { locale: ro })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-line">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleAddComment} className="mt-6">
                  <div className="flex flex-col gap-2">
                    <textarea
                      placeholder="Adaugă un comentariu..."
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={!commentContent.trim() || addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Adaugă comentariu
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attachments" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Atașamente</CardTitle>
                <Button asChild>
                  <Link href={`/tasks/${task.id}/upload`}>
                    <FileText className="mr-2 h-4 w-4" /> Încarcă fișier
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    Nu există atașamente pentru acest task.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map((attachment) => (
                      <Card key={attachment.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-10 w-10 text-primary" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate" title={attachment.file_name}>
                                {attachment.file_name}
                              </h4>
                              <div className="flex flex-col text-xs text-muted-foreground">
                                <span>{formatFileSize(attachment.file_size)}</span>
                                <span title={`Încărcat de ${attachment.uploaded_by_name}`}>
                                  {attachment.uploaded_by_name}
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" download>
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}