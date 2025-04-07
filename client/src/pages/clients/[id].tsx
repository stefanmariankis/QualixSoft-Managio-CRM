import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Calendar, CreditCard, FileText, History, Edit, Trash2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DashboardLayout from "@/components/layout/dashboard-layout";

// Tipurile de date pentru client și proiecte
type Project = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  start_date: Date | null;
  end_date: Date | null;
  budget: number | null;
  client_id: number;
  organization_id: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
};

type Client = {
  id: number;
  organization_id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  county: string | null;
  postal_code: string | null;
  country: string;
  notes: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  logo_url: string | null;
  source: string;
  status: string;
  created_by: number;
  account_manager_id: number | null;
  created_at: Date;
  updated_at: Date;
};

type ClientDetailsResponse = {
  client: Client;
  projects: Project[];
  invoices: Invoice[];
};

export default function ClientDetails() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const clientId = parseInt(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Obținem detaliile clientului
  const { data, isLoading, error } = useQuery<ClientDetailsResponse>({
    queryKey: ['/api/clients', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca detaliile clientului');
      }
      
      return await response.json();
    }
  });
  
  // Mutația pentru ștergerea clientului
  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/clients/${clientId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client șters",
        description: "Clientul a fost șters cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setLocation('/clients');
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge clientul",
        variant: "destructive",
      });
    }
  });
  
  // Handle-uri pentru acțiuni
  const handleDelete = () => {
    deleteClientMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  // Dacă se încarcă datele, afișăm un loader
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă detaliile clientului...</p>
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
              {error instanceof Error ? error.message : "Nu s-au putut încărca detaliile clientului"}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => setLocation('/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la lista de clienți
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const { client, projects, invoices } = data;
  
  // Funcție pentru formatarea datelor
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Nedefinit';
    return format(new Date(date), 'd MMMM yyyy', { locale: ro });
  };
  
  // Culori pentru statusuri
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'activ':
        return 'bg-green-100 text-green-800';
      case 'inactiv':
        return 'bg-gray-100 text-gray-800';
      case 'în așteptare':
        return 'bg-yellow-100 text-yellow-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Culori pentru statusuri proiecte
  const getProjectStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'în progres':
        return 'bg-blue-100 text-blue-800';
      case 'completat':
        return 'bg-green-100 text-green-800';
      case 'în așteptare':
        return 'bg-yellow-100 text-yellow-800';
      case 'anulat':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              onClick={() => setLocation('/clients')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Detalii client</h1>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/clients/edit/${client.id}`}>
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
                    Sunteți sigur că doriți să ștergeți clientul {client.name}? Această acțiune este ireversibilă.
                    {projects.length > 0 && (
                      <Alert className="mt-4" variant="warning">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atenție</AlertTitle>
                        <AlertDescription>
                          Acest client are {projects.length} proiecte asociate. Trebuie să ștergeți întâi proiectele sau să le transferați la alt client.
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
                    disabled={projects.length > 0 || deleteClientMutation.isPending}
                  >
                    {deleteClientMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Șterge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Informații de bază */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border">
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{client.name}</CardTitle>
                    <CardDescription>{client.industry || 'Nicio industrie specificată'}</CardDescription>
                    <div className="mt-2">
                      <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Informații de contact</h3>
                    <Separator />
                    
                    <div className="space-y-2">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${client.email}`} className="text-sm hover:underline">{client.email}</a>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${client.phone}`} className="text-sm hover:underline">{client.phone}</a>
                        </div>
                      )}
                      
                      {client.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">{client.website}</a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Adresă</h3>
                    <Separator />
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">
                        {client.address ? (
                          <>
                            {client.address}
                            {(client.city || client.county) && <br />}
                            {client.city}{client.city && client.county && ', '}{client.county}
                            {client.postal_code && <>, {client.postal_code}</>}
                            <br />
                            {client.country}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Adresă nespecificată</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Informații companie</h3>
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="text-muted-foreground mr-2">Mărime:</span>
                          {client.company_size || 'Nespecificat'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="text-muted-foreground mr-2">Sursă:</span>
                          {client.source || 'Nespecificat'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Informații cont</h3>
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="text-muted-foreground mr-2">Client din:</span>
                          {formatDate(client.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="text-muted-foreground mr-2">Ultima actualizare:</span>
                          {formatDate(client.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {client.notes && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Note</h3>
                  <Separator />
                  <p className="text-sm whitespace-pre-line">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rezumat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">Proiecte</h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-bold">{projects.length}</span>
                    <Link href={`/projects?clientId=${client.id}`} className="text-xs text-primary hover:underline">
                      Vezi toate
                    </Link>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>
                        {projects.filter(p => p.status.toLowerCase() === 'completat').length} Completate
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-blue-500" />
                      <span>
                        {projects.filter(p => p.status.toLowerCase() === 'în progres').length} În progres
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                      <span>
                        {projects.filter(p => p.status.toLowerCase() === 'în așteptare').length} În așteptare
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span>
                        {projects.filter(p => p.status.toLowerCase() === 'anulat').length} Anulate
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">Facturi</h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-bold">{invoices.length}</span>
                    <Link href={`/invoices?clientId=${client.id}`} className="text-xs text-primary hover:underline">
                      Vezi toate
                    </Link>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>
                        {invoices.filter(i => i.status === 'paid').length} Plătite
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                      <span>
                        {invoices.filter(i => i.status === 'sent').length} Neachitate
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span>
                        {invoices.filter(i => i.status === 'overdue').length} Întârziate
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" asChild>
                  <Link href={`/projects/new?clientId=${client.id}`}>
                    Adaugă proiect nou
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/invoices?clientId=${client.id}`}>
                    Creează factură
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Secțiuni cu tab-uri pentru proiecte, facturi, etc. */}
        <Tabs defaultValue="projects" className="mt-6">
          <TabsList>
            <TabsTrigger value="projects">Proiecte</TabsTrigger>
            <TabsTrigger value="invoices">Facturi</TabsTrigger>
            <TabsTrigger value="activity">Activitate</TabsTrigger>
            <TabsTrigger value="files">Fișiere</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Proiecte</CardTitle>
                  <Button asChild size="sm">
                    <Link href={`/projects/new?clientId=${client.id}`}>
                      Adaugă proiect
                    </Link>
                  </Button>
                </div>
                <CardDescription>Toate proiectele asociate acestui client</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">Niciun proiect</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Acest client nu are încă niciun proiect asociat.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href={`/projects/new?clientId=${client.id}`}>
                        Adaugă primul proiect
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Nume</th>
                          <th className="pb-2 text-left font-medium">Status</th>
                          <th className="pb-2 text-left font-medium">Dată început</th>
                          <th className="pb-2 text-left font-medium">Dată finalizare</th>
                          <th className="pb-2 text-left font-medium">Buget</th>
                          <th className="pb-2 text-left font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((project) => (
                          <tr key={project.id} className="border-b">
                            <td className="py-3">
                              <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                                {project.name}
                              </Link>
                              {project.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                              )}
                            </td>
                            <td className="py-3">
                              <Badge className={getProjectStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                            </td>
                            <td className="py-3">{formatDate(project.start_date)}</td>
                            <td className="py-3">{formatDate(project.end_date)}</td>
                            <td className="py-3">
                              {project.budget 
                                ? new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(project.budget)
                                : '-'}
                            </td>
                            <td className="py-3">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/projects/${project.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Facturi</CardTitle>
                  <Button asChild size="sm">
                    <Link href={`/invoices?clientId=${client.id}`}>
                      Adaugă factură
                    </Link>
                  </Button>
                </div>
                <CardDescription>Toate facturile emise pentru acest client</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">Nicio factură</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nu există încă facturi pentru acest client.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href={`/invoices?clientId=${client.id}`}>
                        Creează prima factură
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Număr</th>
                          <th className="pb-2 text-left font-medium">Data emiterii</th>
                          <th className="pb-2 text-left font-medium">Data scadentă</th>
                          <th className="pb-2 text-left font-medium">Status</th>
                          <th className="pb-2 text-right font-medium">Total</th>
                          <th className="pb-2 text-left font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b">
                            <td className="py-3">
                              <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                                {invoice.invoice_number}
                              </Link>
                            </td>
                            <td className="py-3">{formatDate(invoice.issue_date)}</td>
                            <td className="py-3">{formatDate(invoice.due_date)}</td>
                            <td className="py-3">
                              <Badge 
                                className={
                                  invoice.status === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : invoice.status === 'overdue' 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {invoice.status === 'paid' 
                                  ? 'Plătită' 
                                  : invoice.status === 'overdue' 
                                    ? 'Întârziată' 
                                    : 'Neachitată'
                                }
                              </Badge>
                            </td>
                            <td className="py-3 text-right">
                              {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: invoice.currency || 'RON' }).format(invoice.total_amount)}
                            </td>
                            <td className="py-3">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Jurnal de activitate</CardTitle>
                <CardDescription>Istoricul activității pentru acest client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">Nicio activitate înregistrată</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Jurnalul de activitate va fi disponibil în curând.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Fișiere</CardTitle>
                <CardDescription>Documentele asociate acestui client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">Niciun fișier</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nu există încă fișiere asociate acestui client.
                  </p>
                  <Button className="mt-4" disabled>
                    Adaugă fișier
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}