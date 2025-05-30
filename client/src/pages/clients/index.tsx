import { useState, useEffect } from "react";
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
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2,
  Building2,
  Phone,
  AtSign,
  MapPin,
  User,
  AlertCircle,
  BarChart4,
  Clock
} from "lucide-react";
import { Client } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

// Diverse industrii pentru filtrare
const industries = [
  'IT', 'Retail', 'Construcții', 'Sănătate', 'Educație', 'Producție', 
  'Servicii financiare', 'Transport', 'Turism', 'Imobiliare', 'Alimentație'
];

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("toate");
  const [filterIndustry, setFilterIndustry] = useState("toate");
  const [location, setLocation] = useLocation();
  const { user } = useQuery({ queryKey: ['/api/me'] }).data || { user: null };
  
  // Verifică dacă utilizatorul are rol de CEO
  useEffect(() => {
    // Dacă utilizatorul nu are rol de CEO, redirecționează la dashboard
    if (user && user.role !== 'ceo') {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);
  
  // Apel API real către server
  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Filtrare clienți
  const filteredClients = clients && Array.isArray(clients) 
    ? clients.filter(client => {
        // Filtrare după termen de căutare
        const matchesSearch = 
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.phone && client.phone.includes(searchTerm));
        
        // Filtrare după status
        const matchesStatus = filterStatus === "toate" || client.status === filterStatus;
        
        // Filtrare după industrie
        const matchesIndustry = filterIndustry === "toate" || client.industry === filterIndustry;
        
        return matchesSearch && matchesStatus && matchesIndustry;
      }) 
    : [];

  // Lista unică de industrii din datele reale
  const uniqueIndustries = clients && Array.isArray(clients) 
    ? Array.from(new Set(clients.map(client => client.industry).filter(Boolean)))
    : [];

  const getStatusBadgeColors = (status: string) => {
    switch(status) {
      case 'activ':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'inactiv':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'prospect':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'fost-client':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Obține numele responsabilului (assignee) pe baza ID-ului
  const getAssigneeName = (assigneeId: number | null) => {
    if (assigneeId === null) return "Neasignat";
    return `Utilizator ${assigneeId}`;
  };

  const daysAgo = (dateValue: string | Date) => {
    if (!dateValue) return "Necunoscut";
    
    // Convertim string la Date dacă e necesar
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Verificăm dacă data este validă
    if (isNaN(date.getTime())) return "Dată invalidă";
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Astăzi";
    if (diffDays === 1) return "Ieri";
    if (diffDays <= 30) return `Acum ${diffDays} zile`;
    if (diffDays <= 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `Acum ${diffMonths} ${diffMonths === 1 ? 'lună' : 'luni'}`;
    }
    const diffYears = Math.floor(diffDays / 365);
    return `Acum ${diffYears} ${diffYears === 1 ? 'an' : 'ani'}`;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clienți</h1>
            <p className="text-muted-foreground">
              Gestionează toate contactele și companiile cu care lucrezi
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus size={16} />
                <span>Client nou</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adaugă client nou</DialogTitle>
                <DialogDescription>
                  Completează detaliile pentru a crea un nou client
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Nume companie</label>
                    <Input id="name" placeholder="Nume companie" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">Status</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activ">Activ</SelectItem>
                        <SelectItem value="inactiv">Inactiv</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="fost-client">Fost client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input id="email" type="email" placeholder="email@companie.ro" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Telefon</label>
                    <Input id="phone" placeholder="+40 700 000 000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="vat_number" className="text-sm font-medium">CUI / CIF</label>
                    <Input id="vat_number" placeholder="RO12345678" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="registration_number" className="text-sm font-medium">Număr Registrul Comerțului</label>
                    <Input id="registration_number" placeholder="J12/3456/2020" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">Adresă completă</label>
                  <Textarea id="address" placeholder="Strada, număr, bloc, etaj, etc." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">Oraș</label>
                    <Input id="city" placeholder="București" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="county" className="text-sm font-medium">Județ</label>
                    <Input id="county" placeholder="București" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="postal_code" className="text-sm font-medium">Cod poștal</label>
                    <Input id="postal_code" placeholder="000000" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="country" className="text-sm font-medium">Țară</label>
                    <Input id="country" placeholder="România" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="industry" className="text-sm font-medium">Industrie</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează industria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Construcții">Construcții</SelectItem>
                        <SelectItem value="Sănătate">Sănătate</SelectItem>
                        <SelectItem value="Educație">Educație</SelectItem>
                        <SelectItem value="Producție">Producție</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="company_size" className="text-sm font-medium">Mărime companie</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează mărimea" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 angajați</SelectItem>
                        <SelectItem value="11-50">11-50 angajați</SelectItem>
                        <SelectItem value="51-200">51-200 angajați</SelectItem>
                        <SelectItem value="201-500">201-500 angajați</SelectItem>
                        <SelectItem value="500+">Peste 500 angajați</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-medium">Website</label>
                  <Input id="website" placeholder="https://example.ro" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">Note</label>
                  <Textarea id="notes" placeholder="Note despre client" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Anulează</Button>
                <Button>Salvează client</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Clienți</CardTitle>
            <CardDescription>
              {filteredClients.length} clienți găsiți
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Caută după nume, email sau telefon..."
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
                        <SelectItem value="activ">Activ</SelectItem>
                        <SelectItem value="inactiv">Inactiv</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="fost-client">Fost client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select 
                      value={filterIndustry}
                      onValueChange={setFilterIndustry}
                    >
                      <SelectTrigger className="w-[160px]">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <span>Industrie</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toate">Toate industriile</SelectItem>
                        {uniqueIndustries.map((industry, index) => (
                          <SelectItem key={index} value={industry}>
                            {industry}
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
                      <TableHead className="w-[250px]">Nume client</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Industrie</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsabil</TableHead>
                      <TableHead>Adăugat</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Se încarcă clienții...
                        </TableCell>
                      </TableRow>
                    ) : filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nu au fost găsiți clienți care să corespundă criteriilor de căutare.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            <Link href={`/clients/${client.id}`} className="hover:underline">
                              <div className="flex items-center space-x-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>{client.name}</span>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-1">
                                <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm">{client.email}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm">{client.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.industry}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadgeColors(client.status)}
                            >
                              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{getAssigneeName(client.assigned_to)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{daysAgo(client.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="icon" title="Vezi statistici">
                                <BarChart4 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Detalii" asChild>
                                <Link href={`/clients/${client.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
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