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
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon,
  Building2, 
  FolderKanban,
  FileText,
  DollarSign,
  Copy,
  Eye,
  Send
} from "lucide-react";
import { Invoice } from "@shared/schema";

// Pentru simulare date
const fakeInvoices: Invoice[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  organization_id: 1,
  client_id: Math.floor(Math.random() * 15) + 1,
  project_id: Math.random() > 0.3 ? Math.floor(Math.random() * 12) + 1 : null,
  invoice_number: `INV-${(new Date().getFullYear())}-${(i + 1).toString().padStart(3, '0')}`,
  issue_date: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
  due_date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
  subtotal: Math.floor(Math.random() * 10000) + 1000,
  tax_rate: 19,
  tax_amount: 0, // se va calcula
  discount_rate: Math.random() > 0.7 ? Math.floor(Math.random() * 15) + 5 : null,
  discount_amount: 0, // se va calcula
  total_amount: 0, // se va calcula
  paid_amount: Math.random() > 0.4 ? Math.floor(Math.random() * 10000) + 1000 : 0,
  remaining_amount: 0, // se va calcula
  status: ['draft', 'paid', 'sent', 'viewed', 'overdue', 'cancelled'][i % 6] as any,
  payment_terms: "15 zile",
  notes: i % 4 === 0 ? "Notă pentru factură" : null,
  currency: "RON",
  created_by: 1,
  created_at: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
  updated_at: new Date(),
}));

// Calculăm valorile financiare pentru fiecare factură
fakeInvoices.forEach(invoice => {
  invoice.tax_amount = invoice.subtotal * (invoice.tax_rate || 0) / 100;
  invoice.discount_amount = invoice.subtotal * (invoice.discount_rate || 0) / 100;
  invoice.total_amount = invoice.subtotal + invoice.tax_amount - invoice.discount_amount;
  invoice.remaining_amount = invoice.total_amount - invoice.paid_amount;
  
  // Actualizăm statusul bazat pe sumele plătite
  if (invoice.status !== 'cancelled') {
    if (invoice.remaining_amount <= 0) {
      invoice.status = 'paid';
    } else if (invoice.paid_amount > 0) {
      invoice.status = 'sent';
    } else if (invoice.due_date < new Date()) {
      invoice.status = 'overdue';
    }
  }
});

// Lista clienți pentru dropdown
const fakeClients = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Client ${i + 1}`
}));

// Lista proiecte pentru dropdown
const fakeProjects = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Proiect ${i + 1}`
}));

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("toate");
  const [filterClient, setFilterClient] = useState("toate");
  
  // Simulează apel API la server
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      // În implementarea reală, de înlocuit cu apelul API real
      return new Promise<Invoice[]>((resolve) => {
        setTimeout(() => resolve(fakeInvoices), 300);
      });
    },
  });

  // Filtrare facturi
  const filteredInvoices = invoices ? invoices.filter(invoice => {
    // Filtrare după termen de căutare
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrare după status
    const matchesStatus = filterStatus === "toate" || invoice.status === filterStatus;
    
    // Filtrare după client
    const matchesClient = filterClient === "toate" || invoice.client_id.toString() === filterClient;
    
    return matchesSearch && matchesStatus && matchesClient;
  }) : [];

  const getStatusBadgeColors = (status: string) => {
    switch(status) {
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'draft':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'sent':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'viewed':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'overdue':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getClientName = (clientId: number) => {
    const client = fakeClients.find(c => c.id === clientId);
    return client ? client.name : `Client ${clientId}`;
  };

  const getProjectName = (projectId: number | null) => {
    if (projectId === null) return "-";
    const project = fakeProjects.find(p => p.id === projectId);
    return project ? project.name : `Proiect ${projectId}`;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString('ro-RO')} ${currency}`;
  };

  // Verificare dată scadentă depășită
  const isOverdue = (dueDate: Date) => {
    return dueDate < new Date() && dueDate < new Date();
  };

  // Determinare CSS class pentru deadline
  const getDueDateClass = (dueDate: Date, status: string) => {
    if (status === 'paid' || status === 'cancelled') return "";
    if (isOverdue(dueDate)) return "text-red-600 font-medium";
    return "";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturi</h1>
            <p className="text-muted-foreground">
              Gestionează facturile și urmărește plățile
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus size={16} />
                <span>Factură nouă</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adaugă factură nouă</DialogTitle>
                <DialogDescription>
                  Completează detaliile pentru a crea o nouă factură
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="client" className="text-sm font-medium">Client</label>
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
                    <label htmlFor="project" className="text-sm font-medium">Proiect (opțional)</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează proiect" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Fără proiect</SelectItem>
                        {fakeProjects.map(project => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="invoice_number" className="text-sm font-medium">Număr factură</label>
                    <Input id="invoice_number" placeholder="INV-2023-001" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="issue_date" className="text-sm font-medium">Data emiterii</label>
                    <Input id="issue_date" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="due_date" className="text-sm font-medium">Data scadentă</label>
                    <Input id="due_date" type="date" />
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
                    <label htmlFor="subtotal" className="text-sm font-medium">Subtotal</label>
                    <Input id="subtotal" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="tax_rate" className="text-sm font-medium">Rată TVA (%)</label>
                    <Input id="tax_rate" type="number" placeholder="19" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="discount_rate" className="text-sm font-medium">Rată Discount (%)</label>
                    <Input id="discount_rate" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="payment_terms" className="text-sm font-medium">Termeni de plată</label>
                    <Input id="payment_terms" placeholder="15 zile" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">Note</label>
                  <Input id="notes" placeholder="Note factură" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Anulează</Button>
                <Button>Salvează factură</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Facturi</CardTitle>
            <CardDescription>
              {filteredInvoices.length} facturi găsite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Caută după număr factură..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex space-x-4">
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
                        <SelectItem value="draft">Schița</SelectItem>
                        <SelectItem value="sent">Emis</SelectItem>
                        <SelectItem value="viewed">Vizualizat</SelectItem>
                        <SelectItem value="paid">Plătit</SelectItem>
                        <SelectItem value="overdue">Restant</SelectItem>
                        <SelectItem value="cancelled">Anulat</SelectItem>
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
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Număr factură</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Proiect</TableHead>
                      <TableHead>Data emiterii</TableHead>
                      <TableHead>Data scadentă</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Se încarcă facturile...
                        </TableCell>
                      </TableRow>
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Nu au fost găsite facturi care să corespundă criteriilor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                              {invoice.invoice_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{getClientName(invoice.client_id)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {invoice.project_id && (
                              <div className="flex items-center space-x-1">
                                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{getProjectName(invoice.project_id)}</span>
                              </div>
                            )}
                            {!invoice.project_id && <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {invoice.issue_date.toLocaleDateString('ro-RO')}
                          </TableCell>
                          <TableCell>
                            <span className={getDueDateClass(invoice.due_date, invoice.status)}>
                              {invoice.due_date.toLocaleDateString('ro-RO')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadgeColors(invoice.status)}
                            >
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="icon" title="Vizualizează">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Trimite">
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Duplică">
                                <Copy className="h-4 w-4" />
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