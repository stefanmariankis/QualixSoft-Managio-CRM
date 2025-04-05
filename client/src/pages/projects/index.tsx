import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Project } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

// Pentru simulare date
const fakeProjects: Project[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  organization_id: 1,
  client_id: Math.floor(Math.random() * 15) + 1,
  name: `Proiect ${i + 1}`,
  description: i % 3 === 0 ? `Descriere pentru proiectul ${i + 1}` : null,
  start_date: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
  end_date: i % 7 !== 0 ? new Date(Date.now() + Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000) : null,
  status: ['planificat', 'în desfășurare', 'în așteptare', 'finalizat', 'anulat'][i % 5] as any,
  budget: i % 3 === 0 ? null : Math.floor(Math.random() * 50000) + 5000,
  currency: 'RON',
  estimated_hours: i % 4 === 0 ? null : Math.floor(Math.random() * 300) + 50,
  completion_percentage: Math.floor(Math.random() * 100),
  priority: ['low', 'medium', 'high'][i % 3] as any,
  manager_id: (i % 3) + 1,
  created_by: 1,
  is_fixed_price: i % 2 === 0,
  category: ['website', 'aplicație mobilă', 'design', 'marketing', 'consultanță'][i % 5] as any,
  created_at: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000),
  updated_at: new Date(),
}));

// Lista clienți pentru dropdown
const fakeClients = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Client ${i + 1} SRL`
}));

// Lista utilizatori pentru dropdown (manageri de proiect)
const fakeUsers = [
  { id: 1, name: "Alexandru Popescu" },
  { id: 2, name: "Maria Ionescu" },
  { id: 3, name: "Ion Vasilescu" }
];

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("toate");
  const [filterClient, setFilterClient] = useState("toate");
  const [filterCategory, setFilterCategory] = useState("toate");
  
  // Simulează apel API la server
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      // În implementarea reală, de înlocuit cu apelul API real
      return new Promise<Project[]>((resolve) => {
        setTimeout(() => resolve(fakeProjects), 300);
      });
    },
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
    const client = fakeClients.find(c => c.id === clientId);
    return client ? client.name : `Client ${clientId}`;
  };

  const getManagerName = (managerId: number) => {
    const user = fakeUsers.find(u => u.id === managerId);
    return user ? user.name : `Manager ${managerId}`;
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

  const formatDateRange = (startDate: Date, endDate: Date | null) => {
    const start = startDate.toLocaleDateString('ro-RO');
    if (!endDate) return `${start} - nedefinit`;
    return `${start} - ${endDate.toLocaleDateString('ro-RO')}`;
  };

  // Verifică dacă proiectul este întârziat (data de final depășită și nu este finalizat)
  const isOverdue = (endDate: Date | null, status: string) => {
    if (!endDate) return false;
    return endDate < new Date() && status !== 'finalizat' && status !== 'anulat';
  };

  // Calculează durata proiectului în zile
  const calculateDuration = (startDate: Date, endDate: Date | null) => {
    if (!endDate) return "nedefinit";
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} zile`;
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
          <Dialog>
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
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Nume proiect</label>
                  <Input id="name" placeholder="Nume proiect" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="client_id" className="text-sm font-medium">Client</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează client" />
                      </SelectTrigger>
                      <SelectContent>
                        {fakeClients.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="manager_id" className="text-sm font-medium">Manager proiect</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {fakeUsers.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="start_date" className="text-sm font-medium">Data început</label>
                    <Input id="start_date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="end_date" className="text-sm font-medium">Data estimată încheiere</label>
                    <Input id="end_date" type="date" />
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
                        <SelectItem value="planificat">Planificat</SelectItem>
                        <SelectItem value="în desfășurare">În desfășurare</SelectItem>
                        <SelectItem value="în așteptare">În așteptare</SelectItem>
                        <SelectItem value="finalizat">Finalizat</SelectItem>
                        <SelectItem value="anulat">Anulat</SelectItem>
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="budget" className="text-sm font-medium">Buget</label>
                    <Input id="budget" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium">Monedă</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RON">RON</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="estimated_hours" className="text-sm font-medium">Ore estimate</label>
                    <Input id="estimated_hours" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">Categorie</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="aplicație mobilă">Aplicație mobilă</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="consultanță">Consultanță</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Descriere</label>
                  <Textarea id="description" placeholder="Descriere proiect" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Anulează</Button>
                <Button>Salvează proiect</Button>
              </DialogFooter>
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
                        {fakeClients.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
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