import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon,
  FolderKanban,
  Clock,
  User
} from "lucide-react";
import { Task } from "@shared/schema";

// Vom folosi date reale din API în loc de date simulate

export default function TasksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("toate");
  const [filterProject, setFilterProject] = useState("toate");
  const [filterAssignee, setFilterAssignee] = useState("toate");
  const [, setLocation] = useLocation();
  
  // Obține lista de sarcini din API
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });
  
  // Obține lista de proiecte pentru dropdown
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  // Obține lista de utilizatori pentru dropdown
  const { data: users } = useQuery({
    queryKey: ["/api/users/organization"],
  });

  // Filtrare sarcini
  const filteredTasks = tasks ? tasks.filter(task => {
    // Filtrare după termen de căutare
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtrare după status
    const matchesStatus = filterStatus === "toate" || task.status === filterStatus;
    
    // Filtrare după proiect
    const matchesProject = filterProject === "toate" || task.project_id.toString() === filterProject;
    
    // Filtrare după persoana asignată
    const matchesAssignee = filterAssignee === "toate" || 
                            (filterAssignee === "neasignat" && task.assigned_to === null) ||
                            (task.assigned_to && task.assigned_to.toString() === filterAssignee);
    
    return matchesSearch && matchesStatus && matchesProject && matchesAssignee;
  }) : [];

  const getStatusBadgeColors = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'not_started':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'under_review':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'on_hold':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getPriorityBadgeColors = (priority: string) => {
    switch(priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'high':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getProjectName = (projectId: number) => {
    if (!projects) return `Proiect ${projectId}`;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Proiect ${projectId}`;
  };

  const getAssigneeName = (assigneeId: number | null) => {
    if (assigneeId === null) return "Neasignat";
    if (!users) return `Utilizator ${assigneeId}`;
    const user = users.find(u => u.id === assigneeId);
    return user ? `${user.firstName} ${user.lastName}` : `Utilizator ${assigneeId}`;
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      'low': 'Scăzută',
      'medium': 'Medie',
      'high': 'Ridicată',
      'urgent': 'Urgentă'
    };
    return map[priority] || priority;
  };

  // Funcție ajutător pentru a asigura că avem un obiect Date valid
  const ensureDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error("Eroare la conversia datei:", error);
      return null;
    }
  };

  // Verificare deadline apropiat
  const isNearDeadline = (dueDate: any) => {
    const date = ensureDate(dueDate);
    if (!date) return false;
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  };

  // Verificare depășire deadline
  const isOverdue = (dueDate: any) => {
    const date = ensureDate(dueDate);
    if (!date) return false;
    return date < new Date();
  };

  // Determinare CSS class pentru deadline
  const getDeadlineClass = (dueDate: any) => {
    if (isOverdue(dueDate)) return "text-red-600 font-medium";
    if (isNearDeadline(dueDate)) return "text-amber-600 font-medium";
    return "";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sarcini</h1>
            <p className="text-muted-foreground">
              Gestionează sarcinile și monitorizează progresul acestora
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus size={16} />
                <span>Sarcină nouă</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adaugă sarcină nouă</DialogTitle>
                <DialogDescription>
                  Completează detaliile pentru a crea o nouă sarcină
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Titlu sarcină</label>
                    <Input id="title" placeholder="Titlu sarcină" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="project" className="text-sm font-medium">Proiect</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează proiect" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects && projects.length > 0 ? (
                          projects.map(project => (
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="assignee" className="text-sm font-medium">Asignat către</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează utilizator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Neasignat</SelectItem>
                        {users && users.length > 0 ? (
                          users.map(user => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-users">Nu există utilizatori disponibili</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="parent_task" className="text-sm font-medium">Sarcină părinte</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Fără părinte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-parent">Fără părinte</SelectItem>
                        {tasks && tasks.length > 0 ? (
                          tasks.map(task => (
                            <SelectItem key={task.id} value={task.id.toString()}>
                              {task.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-tasks">Nu există sarcini disponibile</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="due_date" className="text-sm font-medium">Data finalizare</label>
                    <Input id="due_date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="estimated_hours" className="text-sm font-medium">Ore estimate</label>
                    <Input id="estimated_hours" type="number" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">Status</label>
                    <Select>
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
                    <Select>
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
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Descriere</label>
                  <Input id="description" placeholder="Descriere sarcină" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Anulează</Button>
                <Button>Salvează sarcină</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Sarcini</CardTitle>
            <CardDescription>
              {filteredTasks.length} sarcini găsite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Caută după titlu sarcină..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <Select 
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[160px]">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <span>Status</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toate">Toate statusurile</SelectItem>
                        <SelectItem value="not_started">Neînceput</SelectItem>
                        <SelectItem value="in_progress">În lucru</SelectItem>
                        <SelectItem value="under_review">În verificare</SelectItem>
                        <SelectItem value="completed">Finalizat</SelectItem>
                        <SelectItem value="on_hold">Blocat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select 
                      value={filterProject}
                      onValueChange={setFilterProject}
                    >
                      <SelectTrigger className="w-[160px]">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <span>Proiect</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toate">Toate proiectele</SelectItem>
                        {projects && projects.length > 0 ? (
                          projects.map(project => (
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
                  <div>
                    <Select 
                      value={filterAssignee}
                      onValueChange={setFilterAssignee}
                    >
                      <SelectTrigger className="w-[160px]">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <span>Asignat</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toate">Toți utilizatorii</SelectItem>
                        <SelectItem value="neasignat">Neasignat</SelectItem>
                        {users && users.length > 0 ? (
                          users.map(user => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-users">Nu există utilizatori disponibili</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Titlu sarcină</TableHead>
                      <TableHead>Proiect</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioritate</TableHead>
                      <TableHead>Asignat către</TableHead>
                      <TableHead>Progres</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Se încarcă sarcinile...
                        </TableCell>
                      </TableRow>
                    ) : filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Nu au fost găsite sarcini care să corespundă criteriilor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            <Link href={`/tasks/${task.id}`} className="hover:underline">
                              {task.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{getProjectName(task.project_id)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadgeColors(task.status)}
                            >
                              {
                                task.status === "not_started" ? "Neînceput" :
                                task.status === "in_progress" ? "În lucru" :
                                task.status === "under_review" ? "În verificare" :
                                task.status === "completed" ? "Finalizat" :
                                task.status === "on_hold" ? "Blocat" :
                                task.status
                              }
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getPriorityBadgeColors(task.priority)}
                            >
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{getAssigneeName(task.assigned_to)}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/tasks/edit/${task.id}`);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <Progress value={task.completion_percentage} />
                              <span className="text-xs text-muted-foreground">
                                {task.completion_percentage}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.due_date ? (
                              <div className="flex items-center space-x-1">
                                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className={getDeadlineClass(task.due_date)}>
                                  {ensureDate(task.due_date)?.toLocaleDateString('ro-RO') || 'Dată invalidă'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nedefinit</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}