import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { 
  FileText, Loader2, Search, 
  FilePlus, Copy, Edit, Trash2, 
  MoreHorizontal, Download, CreditCard, 
  FileCheck, File, AlertTriangle
} from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

// Definirea tipurilor
type TemplateType = 'invoice' | 'quote' | 'contract' | 'report' | 'email';

type Template = {
  id: number;
  name: string;
  description: string | null;
  template_type: TemplateType;
  content: string;
  is_default: boolean;
  organization_id: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

// Schemă de validare pentru creare și editare template
const templateSchema = z.object({
  name: z.string().min(3, { message: 'Numele trebuie să aibă cel puțin 3 caractere' }),
  description: z.string().optional(),
  template_type: z.enum(['invoice', 'quote', 'contract', 'report', 'email']),
  content: z.string().min(10, { message: 'Conținutul trebuie să aibă cel puțin 10 caractere' }),
  is_default: z.boolean().default(false),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

// Component pentru pagina de template-uri
export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewContentDialogOpen, setViewContentDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Formulare pentru creare și editare
  const newTemplateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      template_type: 'invoice',
      content: '',
      is_default: false,
    },
  });

  const editTemplateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      template_type: 'invoice',
      content: '',
      is_default: false,
    },
  });

  // Obține lista de template-uri
  const { data: templates, isLoading, error } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca template-urile');
      }
      
      return await response.json();
    }
  });

  // Mutație pentru crearea unui template nou
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const response = await apiRequest('POST', '/api/templates', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template creat",
        description: "Template-ul a fost creat cu succes",
      });
      setNewTemplateDialogOpen(false);
      newTemplateForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea template-ul",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru editarea unui template
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues & { id: number }) => {
      const { id, ...templateData } = data;
      const response = await apiRequest('PATCH', `/api/templates/${id}`, templateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template actualizat",
        description: "Template-ul a fost actualizat cu succes",
      });
      setEditTemplateDialogOpen(false);
      setSelectedTemplate(null);
      editTemplateForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza template-ul",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru ștergerea unui template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiRequest('DELETE', `/api/templates/${templateId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template șters",
        description: "Template-ul a fost șters cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge template-ul",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru setarea unui template ca implicit
  const setDefaultTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: number; templateType: TemplateType }) => {
      const response = await apiRequest('PATCH', `/api/templates/${data.templateId}/set-default`, { 
        template_type: data.templateType 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template actualizat",
        description: "Template-ul a fost setat ca implicit",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut seta template-ul ca implicit",
        variant: "destructive",
      });
    }
  });

  // Filtrarea template-urilor în funcție de tab-ul activ și termenul de căutare
  const filteredTemplates = templates?.filter(template => {
    // Filtrare după tab
    if (activeTab !== 'all' && template.template_type !== activeTab) {
      return false;
    }
    
    // Filtrare după termen de căutare
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        template.name.toLowerCase().includes(searchLower) ||
        (template.description && template.description.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  }) || [];

  // Tratează crearea unui template nou
  const handleCreateTemplate = (values: TemplateFormValues) => {
    createTemplateMutation.mutate(values);
  };

  // Tratează editarea unui template
  const handleEditTemplate = (values: TemplateFormValues) => {
    if (!selectedTemplate) return;
    
    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      ...values
    });
  };

  // Deschide dialogul de editare și populează formularul
  const openEditTemplateDialog = (template: Template) => {
    setSelectedTemplate(template);
    
    editTemplateForm.reset({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      content: template.content,
      is_default: template.is_default,
    });
    
    setEditTemplateDialogOpen(true);
  };

  // Deschide dialogul de vizualizare conținut
  const openViewContentDialog = (template: Template) => {
    setSelectedTemplate(template);
    setViewContentDialogOpen(true);
  };

  // Tratează ștergerea unui template
  const handleDeleteTemplate = (templateId: number) => {
    if (window.confirm('Sigur doriți să ștergeți acest template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  // Tratează setarea unui template ca implicit
  const handleSetDefaultTemplate = (templateId: number, templateType: TemplateType) => {
    setDefaultTemplateMutation.mutate({ templateId, templateType });
  };

  // Obține iconul pentru tipul de template
  const getTemplateTypeIcon = (type: TemplateType) => {
    switch (type) {
      case 'invoice':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'quote':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'contract':
        return <FileCheck className="h-5 w-5 text-purple-500" />;
      case 'report':
        return <File className="h-5 w-5 text-orange-500" />;
      case 'email':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Obține numele tipului de template
  const getTemplateTypeName = (type: TemplateType) => {
    switch (type) {
      case 'invoice':
        return 'Factură';
      case 'quote':
        return 'Ofertă';
      case 'contract':
        return 'Contract';
      case 'report':
        return 'Raport';
      case 'email':
        return 'Email';
      default:
        return type;
    }
  };

  // Render card pentru un template
  const renderTemplateCard = (template: Template) => (
    <Card key={template.id} className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getTemplateTypeIcon(template.template_type)}
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-xs">
                {getTemplateTypeName(template.template_type)}
                {template.is_default && (
                  <Badge variant="secondary" className="ml-2">
                    Implicit
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acțiuni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openViewContentDialog(template)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Vizualizează</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditTemplateDialog(template)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Editează</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                <span>Duplică</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                <span>Descarcă</span>
              </DropdownMenuItem>
              {!template.is_default && (
                <DropdownMenuItem 
                  onClick={() => handleSetDefaultTemplate(template.id, template.template_type)}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  <span>Setează ca implicit</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteTemplate(template.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Șterge</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {template.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Fără descriere</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 text-xs text-muted-foreground">
        <span>Creat de {template.created_by_name}</span>
        <span>{format(new Date(template.updated_at), 'd MMM yyyy', { locale: ro })}</span>
      </CardFooter>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Template-uri Documente</h1>
          
          <div className="flex gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Caută template-uri..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={newTemplateDialogOpen} onOpenChange={setNewTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FilePlus className="mr-2 h-4 w-4" /> Adaugă Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Adaugă Template Nou</DialogTitle>
                  <DialogDescription>
                    Creați un nou template pentru documente.
                  </DialogDescription>
                </DialogHeader>
                <Form {...newTemplateForm}>
                  <form onSubmit={newTemplateForm.handleSubmit(handleCreateTemplate)} className="space-y-6">
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="space-y-4">
                        <FormField
                          control={newTemplateForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nume</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Factură standard" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={newTemplateForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descriere</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="O scurtă descriere a template-ului" 
                                  {...field} 
                                  className="min-h-[80px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={newTemplateForm.control}
                          name="template_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tip Template</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selectează tipul template-ului" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="invoice">Factură</SelectItem>
                                  <SelectItem value="quote">Ofertă</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="report">Raport</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={newTemplateForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conținut</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Introduceți conținutul template-ului aici..."
                                  {...field}
                                  className="min-h-[200px] font-mono text-sm"
                                />
                              </FormControl>
                              <FormDescription>
                                Puteți utiliza variabile în format <code>{"{{nume_variabila}}"}</code> care vor fi înlocuite la generarea documentului. 
                                Exemplu: <code>{"{{client.name}}, {{invoice.number}}"}</code>
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={newTemplateForm.control}
                          name="is_default"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Setează ca template implicit</FormLabel>
                                <FormDescription>
                                  Acest template va fi utilizat implicit pentru generarea documentelor de acest tip.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </ScrollArea>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createTemplateMutation.isPending}
                      >
                        {createTemplateMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Creează Template
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Dialog pentru editare template */}
            <Dialog open={editTemplateDialogOpen} onOpenChange={setEditTemplateDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Editare Template</DialogTitle>
                  <DialogDescription>
                    Modificați template-ul selectat.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editTemplateForm}>
                  <form onSubmit={editTemplateForm.handleSubmit(handleEditTemplate)} className="space-y-6">
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="space-y-4">
                        <FormField
                          control={editTemplateForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nume</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Factură standard" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editTemplateForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descriere</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="O scurtă descriere a template-ului" 
                                  {...field} 
                                  className="min-h-[80px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editTemplateForm.control}
                          name="template_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tip Template</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selectează tipul template-ului" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="invoice">Factură</SelectItem>
                                  <SelectItem value="quote">Ofertă</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="report">Raport</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editTemplateForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conținut</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Introduceți conținutul template-ului aici..."
                                  {...field}
                                  className="min-h-[200px] font-mono text-sm"
                                />
                              </FormControl>
                              <FormDescription>
                                Puteți utiliza variabile în format <code>{"{{nume_variabila}}"}</code> care vor fi înlocuite la generarea documentului. 
                                Exemplu: <code>{"{{client.name}}, {{invoice.number}}"}</code>
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editTemplateForm.control}
                          name="is_default"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Setează ca template implicit</FormLabel>
                                <FormDescription>
                                  Acest template va fi utilizat implicit pentru generarea documentelor de acest tip.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </ScrollArea>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={updateTemplateMutation.isPending}
                      >
                        {updateTemplateMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Salvează Modificările
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Dialog pentru vizualizare conținut */}
            <Dialog open={viewContentDialogOpen} onOpenChange={setViewContentDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedTemplate?.name}
                    <Badge className="ml-2" variant="outline">
                      {selectedTemplate?.template_type && getTemplateTypeName(selectedTemplate.template_type)}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    {selectedTemplate?.description || 'Fără descriere'}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="p-4 border rounded-md bg-slate-50 font-mono text-sm whitespace-pre-wrap">
                    {selectedTemplate?.content}
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button onClick={() => setViewContentDialogOpen(false)} variant="outline">
                    Închide
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedTemplate) {
                        setViewContentDialogOpen(false);
                        openEditTemplateDialog(selectedTemplate);
                      }
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editează
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="invoice">Facturi</TabsTrigger>
            <TabsTrigger value="quote">Oferte</TabsTrigger>
            <TabsTrigger value="contract">Contracte</TabsTrigger>
            <TabsTrigger value="report">Rapoarte</TabsTrigger>
            <TabsTrigger value="email">Email-uri</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Se încarcă template-urile...</p>
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Eroare</AlertTitle>
                    <AlertDescription>
                      {error instanceof Error ? error.message : "Nu s-au putut încărca template-urile"}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Nu există template-uri</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      {searchTerm 
                        ? 'Nu s-au găsit template-uri care să corespundă căutării.' 
                        : 'Nu aveți template-uri create încă. Creați primul dvs. template cu butonul "Adaugă Template".'}
                    </p>
                    <Button className="mt-4" onClick={() => setNewTemplateDialogOpen(true)}>
                      <FilePlus className="mr-2 h-4 w-4" /> Adaugă Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(renderTemplateCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}