import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
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
  Send,
  AlertCircle
} from "lucide-react";
import { Invoice } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function InvoicesPage() {
  // Funcție pentru parsarea parametrilor din URL
  function parseSearchParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const clientId = searchParams.get('clientId');
    return { clientId };
  }

  // State pentru filtrare
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("toate");
  const [filterClient, setFilterClient] = useState("toate");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // State pentru formularul de factură
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("no-project");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("RON");
  const [paymentTerms, setPaymentTerms] = useState("15 zile");
  const [notes, setNotes] = useState("");
  
  // State pentru elementele facturii
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [nextItemId, setNextItemId] = useState(2);
  const [taxRate, setTaxRate] = useState(19);
  const [discountRate, setDiscountRate] = useState(0);

  // Obține parametrii din URL
  const [location, setLocation] = useLocation();
  
  // Efect pentru setarea clientului din URL
  useEffect(() => {
    const { clientId } = parseSearchParams();
    if (clientId) {
      setSelectedClient(clientId);
      // Deschidem automat dialogul pentru factură nouă
      setDialogOpen(true);
    }
  }, [location]);
  
  // Resetăm proiectul când se schimbă clientul selectat
  useEffect(() => {
    // Dacă s-a schimbat clientul, resetăm proiectul la "fără proiect"
    setSelectedProject("no-project");
  }, [selectedClient]);
  
  // Calculează subtotalul, TVA, discount și totalul
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const discountAmount = subtotal * (discountRate / 100);
  const total = subtotal + taxAmount - discountAmount;
  
  // Resetează formularul
  const resetInvoiceForm = () => {
    setSelectedClient("");
    setSelectedProject("no-project");
    setInvoiceNumber("");
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate("");
    setCurrency("RON");
    setPaymentTerms("15 zile");
    setNotes("");
    setInvoiceItems([{ id: 1, description: "", quantity: 1, unitPrice: 0, total: 0 }]);
    setNextItemId(2);
    setTaxRate(19);
    setDiscountRate(0);
  };
  
  // Închide dialogul
  const closeDialog = () => {
    setDialogOpen(false);
    resetInvoiceForm();
  };
  
  // Utilizăm queryClient pentru a invalida queryurile după adăugarea unei facturi noi
  const queryClient = useQueryClient();
  
  // Mutația pentru salvarea facturii
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'A apărut o eroare la salvarea facturii');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidăm queryul pentru a reîncărca datele
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      closeDialog();
      // Afișăm un mesaj de succes
      alert("Factura a fost salvată cu succes!");
    },
    onError: (error) => {
      alert(`Eroare la salvarea facturii: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
    }
  });

  // Salvează factura - trimite datele către server
  const saveInvoice = async () => {
    // Verificare date obligatorii
    if (!selectedClient || !invoiceNumber || !issueDate || !dueDate || !currency) {
      alert("Completați toate câmpurile obligatorii!");
      return;
    }
    
    // Verificare elemente factură
    if (invoiceItems.some(item => item.description === "" || item.quantity < 1 || item.unitPrice <= 0)) {
      alert("Completați corect toate elementele facturii!");
      return;
    }
    
    // Construiește obiectul factură pentru a fi trimis la server
    const invoice = {
      client_id: parseInt(selectedClient),
      project_id: selectedProject === "no-project" ? null : parseInt(selectedProject),
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: dueDate,
      currency: currency,
      payment_terms: paymentTerms,
      notes: notes,
      subtotal: subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount_rate: discountRate,
      discount_amount: discountAmount,
      total_amount: total,
      remaining_amount: total, // Adăugat pentru a respecta schema de validare
      status: "sent", // Schimbat de la "draft" la "sent"
      items: invoiceItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total
      }))
    };
    
    // Trimitem factura către server
    console.log("Salvare factură:", invoice);
    createInvoiceMutation.mutate(invoice);
  };
  
  // Adaugă un element nou la factură
  const addInvoiceItem = () => {
    const newItem: InvoiceItem = { 
      id: nextItemId, 
      description: "", 
      quantity: 1, 
      unitPrice: 0, 
      total: 0 
    };
    setInvoiceItems([...invoiceItems, newItem]);
    setNextItemId(nextItemId + 1);
  };
  
  // Șterge un element din factură
  const removeInvoiceItem = (itemId: number) => {
    if (invoiceItems.length <= 1) {
      return; // Păstrează cel puțin un element în factură
    }
    setInvoiceItems(invoiceItems.filter(item => item.id !== itemId));
  };
  
  // Actualizează un câmp dintr-un element de factură
  const updateInvoiceItem = (
    itemId: number, 
    field: keyof InvoiceItem, 
    value: string | number
  ) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculează totalul dacă s-a schimbat cantitatea sau prețul unitar
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };
  
  // Obține lista de facturi de la server
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["/api/invoices"],
  });
  
  // Obține lista de clienți pentru filtrare și afișare
  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Obține lista de proiecte pentru afișare
  const { data: projects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["/api/projects"],
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
    if (!clients) return `Client ${clientId}`;
    const client = clients.find(c => c.id === clientId);
    return client ? (client.name || client.company_name) : `Client ${clientId}`;
  };

  const getProjectName = (projectId: number | null) => {
    if (projectId === null) return "-";
    if (!projects) return `Proiect ${projectId}`;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Proiect ${projectId}`;
  };

  const formatCurrency = (amount: number | undefined, currency: string | undefined) => {
    if (amount === undefined || currency === undefined) {
      return "N/A";
    }
    return `${amount.toLocaleString('ro-RO')} ${currency}`;
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
      console.error(`Dată invalidă:`, dateInput);
      return null;
    }
  };
  
  // Funcție pentru formatarea datelor
  const formatDate = (dateInput: any) => {
    const date = ensureDate(dateInput);
    if (!date) return "Dată nespecificată";
    return date.toLocaleDateString('ro-RO');
  };

  // Verificare dată scadentă depășită
  const isOverdue = (dueDateInput: any) => {
    const dueDate = ensureDate(dueDateInput);
    if (!dueDate) return false;
    return dueDate < new Date();
  };

  // Determinare CSS class pentru deadline
  const getDueDateClass = (dueDateInput: any, status: string) => {
    if (status === 'paid' || status === 'cancelled') return "";
    if (isOverdue(dueDateInput)) return "text-red-600 font-medium";
    return "";
  };

  // Afișare erori
  if (error) {
    return (
      <DashboardLayout>
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Nu s-au putut încărca facturile. Încearcă din nou."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reîncarcă pagina
        </Button>
      </DashboardLayout>
    );
  }

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                    <Select 
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează client" />
                      </SelectTrigger>
                      <SelectContent>
                        {isClientsLoading ? (
                          <SelectItem value="loading">Se încarcă...</SelectItem>
                        ) : clients && clients.length > 0 ? (
                          clients.map(client => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name || client.company_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none">Nu există clienți</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="project" className="text-sm font-medium">Proiect (opțional)</label>
                    <Select 
                      value={selectedProject}
                      onValueChange={setSelectedProject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează proiect" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-project">Fără proiect</SelectItem>
                        {isProjectsLoading ? (
                          <SelectItem value="loading">Se încarcă...</SelectItem>
                        ) : projects && projects.length > 0 ? (
                          // Filtrăm proiectele pentru a afișa doar cele ale clientului selectat
                          projects
                            .filter(project => !selectedClient || project.client_id === parseInt(selectedClient))
                            .map(project => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="none">Nu există proiecte</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="invoice_number" className="text-sm font-medium">Număr factură</label>
                    <Input 
                      id="invoice_number" 
                      placeholder="INV-2023-001" 
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="issue_date" className="text-sm font-medium">Data emiterii</label>
                    <Input 
                      id="issue_date" 
                      type="date" 
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="due_date" className="text-sm font-medium">Data scadentă</label>
                    <Input 
                      id="due_date" 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium">Monedă</label>
                    <Select
                      value={currency}
                      onValueChange={setCurrency}
                    >
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
                <div className="space-y-4 border rounded-md p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Elemente factură</h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8"
                      onClick={addInvoiceItem}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Adaugă element
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Elementele facturii adăugate dinamic */}
                    {invoiceItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end border-b pb-3">
                        <div className="col-span-5 space-y-1">
                          <label className="text-xs font-medium">Descriere</label>
                          <Input 
                            placeholder="Descriere serviciu/produs" 
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(item.id, "description", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-xs font-medium">Cantitate</label>
                          <Input 
                            type="number" 
                            placeholder="1" 
                            min="1" 
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(item.id, "quantity", Number(e.target.value))}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-xs font-medium">Preț unitar</label>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={item.unitPrice}
                            onChange={(e) => updateInvoiceItem(item.id, "unitPrice", Number(e.target.value))}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-xs font-medium">Total</label>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={item.total} 
                            readOnly 
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-10 w-10 p-0"
                            onClick={() => removeInvoiceItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="space-y-2">
                      <label htmlFor="payment_terms" className="text-sm font-medium">Termeni de plată</label>
                      <Input 
                        id="payment_terms" 
                        placeholder="15 zile" 
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 mt-4">
                      <label htmlFor="notes" className="text-sm font-medium">Note</label>
                      <Input 
                        id="notes" 
                        placeholder="Note factură" 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 border rounded-md p-4">
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Subtotal:</span>
                      <span className="text-sm font-medium">{subtotal.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">TVA:</span>
                        <Input 
                          id="tax_rate" 
                          type="number" 
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="h-7 w-16 text-sm" 
                        />
                        <span className="text-sm">%</span>
                      </div>
                      <span className="text-sm font-medium">{taxAmount.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Discount:</span>
                        <Input 
                          id="discount_rate" 
                          type="number" 
                          value={discountRate}
                          onChange={(e) => setDiscountRate(Number(e.target.value))}
                          className="h-7 w-16 text-sm" 
                        />
                        <span className="text-sm">%</span>
                      </div>
                      <span className="text-sm font-medium">{discountAmount.toFixed(2)} RON</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between py-1">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="text-sm font-bold">{total.toFixed(2)} RON</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Anulează</Button>
                <Button onClick={saveInvoice}>Salvează factură</Button>
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
                        {isClientsLoading ? (
                          <SelectItem value="loading">Se încarcă...</SelectItem>
                        ) : clients && clients.length > 0 ? (
                          clients.map(client => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name || client.company_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none">Nu există clienți</SelectItem>
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
                          </TableCell>
                          <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                          <TableCell className={getDueDateClass(invoice.due_date, invoice.status)}>
                            {formatDate(invoice.due_date)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(invoice.total_amount, invoice.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeColors(invoice.status)}>
                              {invoice.status === 'draft' && 'Schiță'}
                              {invoice.status === 'sent' && 'Emisă'}
                              {invoice.status === 'viewed' && 'Vizualizată'}
                              {invoice.status === 'paid' && 'Plătită'}
                              {invoice.status === 'overdue' && 'Restantă'}
                              {invoice.status === 'cancelled' && 'Anulată'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Send className="h-4 w-4" />
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