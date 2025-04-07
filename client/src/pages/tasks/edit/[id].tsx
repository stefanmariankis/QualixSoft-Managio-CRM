import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ArrowLeft, UserCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function TaskEditPage() {
  const params = useParams();
  const { id } = params;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State pentru toate câmpurile formularului
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  // Obține task-ul
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: [`/api/tasks/${id}`],
  });

  // Obține proiectele
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Obține utilizatorii
  const { data: users } = useQuery({
    queryKey: ["/api/users/organization"],
  });

  // Populează formul când datele sunt încărcate
  useEffect(() => {
    if (task && task.task) {
      setTitle(task.task.title || "");
      setDescription(task.task.description || "");
      setStatus(task.task.status || "");
      setPriority(task.task.priority || "");
      setProjectId(task.task.project_id?.toString() || "");
      setAssigneeId(task.task.assignee_id?.toString() || "");
      
      // Formatarea datei pentru input-ul de tip date
      if (task.task.due_date) {
        const date = new Date(task.task.due_date);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          setDueDate(`${year}-${month}-${day}`);
        }
      }
      
      setEstimatedHours(task.task.estimated_hours?.toString() || "");
    }
  }, [task]);

  const mappedStatuses = {
    "not_started": "Neînceput",
    "in_progress": "În lucru",
    "under_review": "În verificare",
    "completed": "Finalizat",
    "on_hold": "Blocat"
  };

  const mappedPriorities = {
    "low": "Scăzută",
    "medium": "Medie",
    "high": "Ridicată",
    "urgent": "Urgentă"
  };

  // Mutația pentru actualizarea task-ului
  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Eroare la actualizarea sarcinii");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sarcină actualizată",
        description: "Sarcina a fost actualizată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      navigate(`/tasks/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      title,
      description,
      status,
      priority,
      project_id: projectId ? parseInt(projectId) : undefined,
      assignee_id: assigneeId ? parseInt(assigneeId) : null,
      due_date: dueDate || null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
    };
    
    updateTaskMutation.mutate(taskData);
  };

  if (taskLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!task || !task.task) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-2">Sarcină negăsită</h1>
          <p className="text-muted-foreground mb-4">Sarcina pe care încerci să o editezi nu există.</p>
          <Button asChild>
            <Link href="/tasks">Înapoi la lista de sarcini</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-4"
          onClick={() => navigate(`/tasks/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Înapoi
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editare sarcină</h1>
          <p className="text-muted-foreground">
            Actualizează informațiile despre sarcină
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Editare sarcină</CardTitle>
          <CardDescription>
            Completează formularul pentru a actualiza sarcina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Titlu sarcină</label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Titlu sarcină"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="project" className="text-sm font-medium">Proiect</label>
                <Select 
                  value={projectId} 
                  onValueChange={setProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează proiect" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects && projects.length > 0 ? (
                      projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-projects">Nu există proiecte disponibile</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select 
                  value={status} 
                  onValueChange={setStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Neînceput</SelectItem>
                    <SelectItem value="in_progress">În lucru</SelectItem>
                    <SelectItem value="under_review">În verificare</SelectItem>
                    <SelectItem value="completed">Finalizat</SelectItem>
                    <SelectItem value="on_hold">Blocat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">Prioritate</label>
                <Select 
                  value={priority} 
                  onValueChange={setPriority}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează prioritate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Scăzută</SelectItem>
                    <SelectItem value="medium">Medie</SelectItem>
                    <SelectItem value="high">Ridicată</SelectItem>
                    <SelectItem value="urgent">Urgentă</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="assignee" className="text-sm font-medium">Asignat către</label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Select 
                      value={assigneeId} 
                      onValueChange={setAssigneeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează utilizator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Neasignat</SelectItem>
                        {users && users.length > 0 ? (
                          users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              {u.firstName} {u.lastName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-users">Nu există utilizatori disponibili</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 whitespace-nowrap"
                    onClick={() => setAssigneeId(user?.id.toString() || "")}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Asignează-mi mie</span>
                    <span className="inline sm:hidden">Mie</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="due_date" className="text-sm font-medium">Data finalizare</label>
                <Input 
                  id="due_date" 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="estimated_hours" className="text-sm font-medium">Ore estimate</label>
                <Input 
                  id="estimated_hours" 
                  type="number" 
                  value={estimatedHours} 
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="spent_hours" className="text-sm font-medium">Ore înregistrate</label>
                <Input 
                  id="spent_hours" 
                  type="number" 
                  value={task.task.spent_hours || "0"} 
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Descriere</label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descriere sarcină"
                className="min-h-32"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/tasks/${id}`)}
              >
                Anulează
              </Button>
              <Button 
                type="submit"
                disabled={updateTaskMutation.isPending}
              >
                {updateTaskMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se actualizează...
                  </>
                ) : (
                  "Salvează modificările"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}