import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Building2,
  Clock,
  User,
  FolderKanban,
  FileText
} from "lucide-react";
import { Project, InsertProject, projectSchema } from "@shared/schema";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Constante pentru utilizare când datele nu sunt încă încărcate
const statusOptions = ['planificat', 'în desfășurare', 'în așteptare', 'finalizat', 'anulat'];
const priorityOptions = ['low', 'medium', 'high'];
const categoryOptions = ['website', 'aplicație mobilă', 'design', 'marketing', 'consultanță'];

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("toate");
  const [filterClient, setFilterClient] = useState("toate");
  const [filterCategory, setFilterCategory] = useState("toate");
  
  // Obținem datele despre clienți pentru afișare nume
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Obținem utilizatorii organizației pentru managerii de proiect
  const { data: users } = useQuery({
    queryKey: ['/api/users/organization'],
  });

  // Obținem lista de proiecte din API
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Filtrare proiecte
  const filteredProjects = projects ? projects.filter(project => {
    // Filtrare după termen de căutare
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtrare după status
    const matchesStatus = filterStatus === "toate" || project.status === filterStatus;
    
    // Filtrare după client
    const matchesClient = filterClient === "toate" || project.client_id.toString() === filterClient;
    
    // Filtrare după categorie
    const matchesCategory = filterCategory === "toate" || project.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesClient && matchesCategory;
  }) : [];

  // Lista unică de categorii
  const categories = projects 
    ? [...new Set(projects.map(project => project.category))]
    : [];

  const getStatusBadgeColors = (status: string) => {
    switch(status) {
      case 'planificat':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'în desfășurare':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'în așteptare':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'finalizat':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'anulat':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getPriorityBadgeColors = (priority: string) => {
    switch(priority) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'medium':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getClientName = (clientId: number) => {
    if (!clients) return `Client ${clientId}`;
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : `Client ${clientId}`;
  };

  const getManagerName = (managerId: number) => {
    if (!users) return `Manager ${managerId}`;
    const user = users.find(u => u.id === managerId);
    // Folosim firstName și lastName pentru a afișa numele întreg
    return user ? `${user.firstName} ${user.lastName}` : `Manager ${managerId}`;
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return "-";
    return `${amount.toLocaleString('ro-RO')} ${currency}`;
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      'low': 'Scăzută',
      'medium': 'Medie',
      'high': 'Ridicată'
    };
    return map[priority] || priority;
  };

  // Funcție utilitară pentru a valida o dată
  const ensureDate = (dateInput: any): Date | null => {
    if (!dateInput) return null;
    
    if (dateInput instanceof Date) {
      // Verificăm dacă obiectul Date este valid
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    try {
      // Încercăm să convertim string-ul sau alt tip de date în Date
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error(`Eroare la conversia datei ${dateInput}:`, error);
      return null;
    }
  };

  const formatDateRange = (startDateInput: any, endDateInput: any) => {
    const startDate = ensureDate(startDateInput);
    const endDate = ensureDate(endDateInput);
    
    if (!startDate) return "Dată nespecificată";
    
    const start = startDate.toLocaleDateString('ro-RO');
    if (!endDate) return `${start} - nedefinit`;
    
    return `${start} - ${endDate.toLocaleDateString('ro-RO')}`;
  };

  // Verifică dacă proiectul este întârziat (data de final depășită și nu este finalizat)
  const isOverdue = (endDateInput: any, status: string) => {
    const endDate = ensureDate(endDateInput);
    if (!endDate) return false;
    return endDate < new Date() && status !== 'finalizat' && status !== 'anulat';
  };

  // Calculează durata proiectului în zile
  const calculateDuration = (startDateInput: any, endDateInput: any) => {
    const startDate = ensureDate(startDateInput);
    const endDate = ensureDate(endDateInput);
    
    if (!startDate || !endDate) return "nedefinit";
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} zile`;
  };

  // Definește mutația pentru adăugarea unui proiect nou
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Folosim schema de proiect existentă pentru validare
  const projectFormSchema = projectSchema.extend({
    name: projectSchema.shape.name.min(3, {
      message: "Numele proiectului trebuie să aibă cel puțin 3 caractere"
    }),
  });

  // Definește formularul
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      client_id: 0,
      manager_id: 0,
      start_date: new Date(),
      end_date: null,
      status: "planificat",
      priority: "medium",
      category: "website",
      budget: null,
      currency: "EUR",
      description: "",
      estimated_hours: null,
      completion_percentage: 0
    }
  });

  // Mutația pentru adăugarea unui proiect nou
  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidează query-ul pentru a reîncărca lista de proiecte
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Proiect adăugat",
        description: "Proiectul a fost adăugat cu succes",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la adăugarea proiectului",
        variant: "destructive",
      });
    }
  });

  // Handler pentru trimiterea formularului
  const onSubmit = (data: z.infer<typeof projectFormSchema>) => {
    // Convertim ID-urile la numere
    const formattedData: Partial<InsertProject> = {
      ...data,
      client_id: parseInt(data.client_id.toString(), 10),
      manager_id: data.manager_id ? parseInt(data.manager_id.toString(), 10) : null,
      budget: data.budget ? parseFloat(data.budget.toString()) : null,
      estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours.toString()) : null,
      completion_percentage: 0
    };
    createProjectMutation.mutate(formattedData as InsertProject);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proiecte</h1>
            <p className="text-muted-foreground">
              Gestionează proiectele și monitorizează progresul acestora
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus size={16} />
                <span>Proiect nou</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adaugă proiect nou</DialogTitle>
                <DialogDescription>
                  Completează detaliile pentru a crea un nou proiect
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nume proiect</FormLabel>
                        <FormControl>
                          <Input placeholder="Nume proiect" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients ? clients.map(client => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              )) : null}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="manager_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager proiect</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users ? users.map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {`${user.firstName} ${user.lastName}`}
                                </SelectItem>
                              )) : null}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data început</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? new Date(field.value).toISOString().substring(0, 10) : ''} 
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data estimată încheiere</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? new Date(field.value).toISOString().substring(0, 10) : ''} 
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioritate</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează prioritate" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {priorityOptions.map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {getPriorityLabel(priority)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buget</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field} 
                              value={field.value || ''} 
                              onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monedă</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează moneda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RON">RON</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimated_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ore estimate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field} 
                              value={field.value || ''} 
                              onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categorie</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează categorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoryOptions.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descriere</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descriere proiect" 
                            rows={3} 
                            {...field} 
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Anulează
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProjectMutation.isPending}
                    >
                      {createProjectMutation.isPending && (
                        <span className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvează proiect
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Proiecte</CardTitle>
            <CardDescription>
              {filteredProjects.length} proiecte găsite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Caută după nume proiect..."
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
                        <SelectItem value="planificat">Planificat</SelectItem>
                        <SelectItem value="în desfășurare">În desfășurare</SelectItem>
                        <SelectItem value="în așteptare">În așteptare</SelectItem>
                        <SelectItem value="finalizat">Finalizat</SelectItem>
                        <SelectItem value="anulat">Anulat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select 
                      value={filterClient}
                      onValueChange={setFilterClient}
                    >
                      <SelectTrigger className="w-[160px]">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <span>Client</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toate">Toți clienții</SelectItem>
                        {clients ? clients.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select 
                      value={filterCategory}
                      onValueChange={setFilterCategory}
                    >
                      <SelectTrigger className="w-[160px]">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <span>Categorie</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toate">Toate categoriile</SelectItem>
                        {categories.map((category, index) => (
                          <SelectItem key={index} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Nume proiect</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Perioada</TableHead>
                      <TableHead>Progres</TableHead>
                      <TableHead>Prioritate</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Se încarcă proiectele...
                        </TableCell>
                      </TableRow>
                    ) : filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Nu au fost găsite proiecte care să corespundă criteriilor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            <Link href={`/projects/${project.id}`} className="hover:underline">
                              <div className="flex items-center space-x-1">
                                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                <span>{project.name}</span>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{getClientName(project.client_id)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{getManagerName(project.manager_id)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadgeColors(project.status)}
                            >
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className={isOverdue(project.end_date, project.status) ? "text-red-600 font-medium" : ""}>
                                {formatDateRange(project.start_date, project.end_date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <Progress value={project.completion_percentage} />
                              <span className="text-xs text-muted-foreground">
                                {project.completion_percentage}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getPriorityBadgeColors(project.priority)}
                            >
                              {getPriorityLabel(project.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="icon" title="Vezi detalii">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Editează">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Șterge">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Mai multe">
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