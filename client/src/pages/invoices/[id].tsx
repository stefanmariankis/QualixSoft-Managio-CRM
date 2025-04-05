import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, ArrowLeft, Building2, Calendar as CalendarIcon, 
  FileText, Edit, Trash2, Download, Send, Check, Ban,
  Printer, Clock, User, AlertCircle, CreditCard, DollarSign,
  MoreHorizontal, Share2, Copy
} from "lucide-react";
import { format, differenceInDays, isAfter } from 'date-fns';
import { ro } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";

// Tipurile de date
type Invoice = {
  id: number;
  invoice_number: string;
  client_id: number;
  project_id: number | null;
  issue_date: string;
  due_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string | null;
  payment_terms: string | null;
  file_url: string | null;
  created_by: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
};

type InvoiceItem = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
};

type Payment = {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

type InvoiceDetailsResponse = {
  invoice: Invoice;
  items: InvoiceItem[];
  payments: Payment[];
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    city: string | null;
    county: string | null;
    postal_code: string | null;
    country: string;
  };
  project: {
    id: number;
    name: string;
  } | null;
};

export default function InvoiceDetails() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const invoiceId = parseInt(params.id);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer bancar');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Obținem detaliile facturii
  const { data, isLoading, error } = useQuery<InvoiceDetailsResponse>({
    queryKey: ['/api/invoices', invoiceId],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca detaliile facturii');
      }
      
      return await response.json();
    }
  });
  
  // Mutația pentru ștergerea facturii
  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/invoices/${invoiceId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Factură ștearsă",
        description: "Factura a fost ștearsă cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setLocation('/invoices');
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge factura",
        variant: "destructive",
      });
    }
  });
  
  // Mutația pentru trimiterea facturii
  const sendInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/invoices/${invoiceId}/send`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Factură trimisă",
        description: "Factura a fost trimisă cu succes către client",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices', invoiceId] });
      setSendDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut trimite factura",
        variant: "destructive",
      });
    }
  });
  
  // Mutația pentru marcarea facturii ca plătită
  const markPaidMutation = useMutation({
    mutationFn: async (paymentData: {
      amount: number;
      payment_method: string;
      reference?: string;
      notes?: string;
    }) => {
      const response = await apiRequest('POST', `/api/invoices/${invoiceId}/payments`, paymentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plată înregistrată",
        description: "Plata a fost înregistrată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices', invoiceId] });
      setMarkPaidDialogOpen(false);
      setPaymentAmount('');
      setPaymentMethod('transfer bancar');
      setPaymentReference('');
      setPaymentNotes('');
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut înregistra plata",
        variant: "destructive",
      });
    }
  });
  
  // Mutația pentru anularea facturii
  const cancelInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/invoices/${invoiceId}`, { status: 'cancelled' });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Factură anulată",
        description: "Factura a fost anulată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices', invoiceId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut anula factura",
        variant: "destructive",
      });
    }
  });
  
  // Handle-uri pentru acțiuni
  const handleDelete = () => {
    deleteInvoiceMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  const handleSendInvoice = () => {
    sendInvoiceMutation.mutate();
  };
  
  const handleMarkPaid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentAmount) {
      toast({
        title: "Eroare",
        description: "Suma plătită este obligatorie",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Eroare",
        description: "Suma plătită trebuie să fie un număr pozitiv",
        variant: "destructive",
      });
      return;
    }
    
    markPaidMutation.mutate({
      amount,
      payment_method: paymentMethod,
      reference: paymentReference || undefined,
      notes: paymentNotes || undefined,
    });
  };
  
  const handleCancelInvoice = () => {
    cancelInvoiceMutation.mutate();
  };
  
  // Funcții helper
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiat",
        description: message,
      });
    });
  };
  
  // Dacă se încarcă datele, afișăm un loader
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă detaliile facturii...</p>
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
              {error instanceof Error ? error.message : "Nu s-au putut încărca detaliile facturii"}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => setLocation('/invoices')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la lista de facturi
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const { invoice, items, payments, client, project } = data;
  
  // Funcție pentru formatarea datelor
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nedefinit';
    return format(new Date(dateString), 'd MMMM yyyy', { locale: ro });
  };
  
  // Funcție pentru formatarea sumelor
  const formatAmount = (amount: number, currency: string = invoice.currency) => {
    return new Intl.NumberFormat('ro-RO', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Calculează suma plătită
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculează suma rămasă de plată
  const remainingAmount = invoice.total_amount - totalPaid;
  
  // Verifică dacă factura este scadentă
  const isOverdue = () => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    return isAfter(new Date(), new Date(invoice.due_date));
  };
  
  // Calculează zilele rămase până la scadență sau zilele de întârziere
  const getDaysInfo = () => {
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const days = differenceInDays(dueDate, today);
    
    if (days > 0) {
      return `${days} zile până la scadență`;
    } else if (days < 0) {
      return `Întârziere ${Math.abs(days)} zile`;
    } else {
      return 'Scadentă astăzi';
    }
  };
  
  // Culori pentru statusuri
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Traduce statusul facturii
  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'Ciornă';
      case 'sent':
        return 'Trimisă';
      case 'paid':
        return 'Plătită';
      case 'overdue':
        return 'Restantă';
      case 'cancelled':
        return 'Anulată';
      default:
        return status;
    }
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
              onClick={() => setLocation('/invoices')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="mr-2">Factura {invoice.invoice_number}</span>
                <Badge className={getStatusColor(invoice.status)}>{translateStatus(invoice.status)}</Badge>
              </h1>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>
                  Client: <Link href={`/clients/${client.id}`} className="hover:underline">{client.name}</Link>
                </span>
                {project && (
                  <span className="flex items-center space-x-1 ml-4">
                    <FileText className="h-3.5 w-3.5" />
                    <span>
                      Proiect: <Link href={`/projects/${project.id}`} className="hover:underline">{project.name}</Link>
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  <span>Printează</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/invoices/${invoice.id}`, "Link-ul a fost copiat în clipboard")}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copiază link</span>
                </DropdownMenuItem>
                {invoice.file_url && (
                  <DropdownMenuItem asChild>
                    <a href={invoice.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Descarcă PDF</span>
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {invoice.status === 'draft' && (
              <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Send className="mr-2 h-4 w-4" /> Trimite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Trimite factură</DialogTitle>
                    <DialogDescription>
                      Sunteți sigur că doriți să trimiteți factura {invoice.invoice_number} către {client.name}?
                      <div className="mt-2">
                        Factura va fi trimisă la adresa de email: <strong>{client.email}</strong>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                      Anulează
                    </Button>
                    <Button 
                      onClick={handleSendInvoice}
                      disabled={sendInvoiceMutation.isPending}
                    >
                      {sendInvoiceMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Trimite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Check className="mr-2 h-4 w-4" /> Marchează plătită
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Înregistrează plată</DialogTitle>
                    <DialogDescription>
                      Înregistrați o plată pentru factura {invoice.invoice_number}.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleMarkPaid}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="amount" className="text-sm font-medium">
                          Suma plătită ({invoice.currency})
                        </label>
                        <input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="1000.00"
                          defaultValue={remainingAmount.toString()}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Sumă restantă: {formatAmount(remainingAmount)}
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="payment_method" className="text-sm font-medium">
                          Metodă de plată
                        </label>
                        <select
                          id="payment_method"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="transfer bancar">Transfer bancar</option>
                          <option value="card">Card</option>
                          <option value="numerar">Numerar</option>
                          <option value="altele">Altele</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="reference" className="text-sm font-medium">
                          Referință plată
                        </label>
                        <input
                          id="reference"
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Referință tranzacție, număr ordin plată, etc."
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="notes" className="text-sm font-medium">
                          Note
                        </label>
                        <textarea
                          id="notes"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Detalii suplimentare despre plată"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setMarkPaidDialogOpen(false)} type="button">
                        Anulează
                      </Button>
                      <Button 
                        type="submit"
                        disabled={markPaidMutation.isPending}
                      >
                        {markPaidMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Înregistrează plata
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <Button 
                variant="outline" 
                onClick={handleCancelInvoice}
                disabled={cancelInvoiceMutation.isPending}
              >
                {cancelInvoiceMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                Anulează
              </Button>
            )}
            
            {invoice.status === 'draft' && (
              <Button variant="outline" asChild>
                <Link href={`/invoices/edit/${invoice.id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Editează
                </Link>
              </Button>
            )}
            
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
                    Sunteți sigur că doriți să ștergeți factura {invoice.invoice_number}? Această acțiune este ireversibilă.
                    {payments.length > 0 && (
                      <Alert className="mt-4" variant="warning">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atenție</AlertTitle>
                        <AlertDescription>
                          Această factură are {payments.length} plăți asociate. Acestea vor fi șterse odată cu factura.
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
                    disabled={deleteInvoiceMutation.isPending}
                  >
                    {deleteInvoiceMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Șterge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Rezumat factură */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Date factură</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Emisă:</span>
                  <span className="text-sm font-medium">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Scadentă:</span>
                  <span className={`text-sm font-medium ${isOverdue() ? 'text-red-600' : ''}`}>
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
                {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                  <div className="text-xs mt-1 text-right">
                    <span className={isOverdue() ? 'text-red-600' : 'text-muted-foreground'}>
                      {getDaysInfo()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Sumă</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">
                {formatAmount(invoice.total_amount)}
              </div>
              <div className="flex flex-col text-xs text-muted-foreground mt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatAmount(invoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA:</span>
                  <span>{formatAmount(invoice.tax_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  <span>Plăți</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">
                {formatAmount(totalPaid)}
              </div>
              <div className="flex flex-col space-y-1 text-xs text-muted-foreground mt-1">
                <div className="flex justify-between">
                  <span>Număr plăți:</span>
                  <span>{payments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rest de plată:</span>
                  <span className={remainingAmount > 0 ? 'text-red-600 font-medium' : ''}>
                    {formatAmount(remainingAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>Client</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-lg font-bold truncate" title={client.name}>
                {client.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                {client.email && (
                  <div className="truncate" title={client.email}>{client.email}</div>
                )}
                {client.phone && (
                  <div>{client.phone}</div>
                )}
                {client.address && (
                  <div className="truncate" title={`${client.address}, ${client.city || ''} ${client.county || ''}`}>
                    {client.address}, {client.city || ''} {client.county || ''}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detalii factură */}
        <Card>
          <CardHeader>
            <CardTitle>Articole factură</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Descriere</TableHead>
                  <TableHead className="text-right">Cantitate</TableHead>
                  <TableHead className="text-right">Preț unitar</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.unit_price)}</TableCell>
                    <TableCell className="text-right">
                      {item.tax_rate > 0 ? (
                        <>
                          {item.tax_rate}% ({formatAmount(item.tax_amount)})
                        </>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatAmount(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-end mt-4">
              <div className="w-[300px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal:</span>
                  <span className="text-sm font-medium">{formatAmount(invoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">TVA:</span>
                  <span className="text-sm font-medium">{formatAmount(invoice.tax_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-sm font-bold">{formatAmount(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Plăți */}
        <Card>
          <CardHeader>
            <CardTitle>Plăți</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                Nu există plăți înregistrate pentru această factură.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dată</TableHead>
                    <TableHead>Metodă</TableHead>
                    <TableHead>Referință</TableHead>
                    <TableHead>Înregistrat de</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Sumă</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>{payment.reference || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {getInitials(payment.created_by_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{payment.created_by_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatAmount(payment.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">Total plăți:</TableCell>
                    <TableCell className="text-right font-bold">{formatAmount(totalPaid)}</TableCell>
                  </TableRow>
                  {remainingAmount > 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-medium">Rest de plată:</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{formatAmount(remainingAmount)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <div className="flex justify-end mt-4">
                <Button onClick={() => setMarkPaidDialogOpen(true)}>
                  <Check className="mr-2 h-4 w-4" /> Adaugă plată
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Note */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm whitespace-pre-line">
                {invoice.notes}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}