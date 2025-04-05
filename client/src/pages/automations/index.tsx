import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Loader2, Search, PlusCircle, 
  Edit, Trash2, MoreHorizontal, 
  PlayCircle, StopCircle, AlertTriangle, 
  Bell, Clock, Wand2, FileInput, List, 
  Mail, ZapIcon, Check, ChevronDown,
  Tag, Workflow, FilePlus, UserPlus, 
  RefreshCcw, Zap, CalendarCheck
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Definirea tipurilor
type AutomationTriggerType = 
  'task_status_change' | 
  'deadline_approaching' | 
  'invoice_overdue' | 
  'time_threshold_reached' | 
  'new_comment' | 
  'file_upload';

type AutomationActionType = 
  'send_notification' | 
  'change_status' | 
  'assign_user' | 
  'send_email' | 
  'create_task' | 
  'add_tag';

type AutomationExecutionStatus = 'success' | 'failed' | 'pending';

type AutomationTrigger = {
  id: number;
  automation_id: number;
  trigger_type: AutomationTriggerType;
  entity_type: string;
  conditions: Record<string, any>;
  order_index: number;
  created_at: string;
};

type AutomationAction = {
  id: number;
  automation_id: number;
  action_type: AutomationActionType;
  action_config: Record<string, any>;
  order_index: number;
  created_at: string;
};

type AutomationLog = {
  id: number;
  automation_id: number;
  trigger_id: number | null;
  entity_type: string;
  entity_id: number;
  execution_status: AutomationExecutionStatus;
  error_message: string | null;
  executed_at: string;
};

type Automation = {
  id: number;
  organization_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  triggers?: AutomationTrigger[];
  actions?: AutomationAction[];
  logs?: AutomationLog[];
};

// Schemă de validare pentru creare și editare automations
const automationSchema = z.object({
  name: z.string().min(3, { message: 'Numele trebuie să aibă cel puțin 3 caractere' }),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Schemă pentru trigger
const triggerSchema = z.object({
  trigger_type: z.enum([
    'task_status_change', 
    'deadline_approaching', 
    'invoice_overdue', 
    'time_threshold_reached', 
    'new_comment', 
    'file_upload'
  ]),
  entity_type: z.string().min(1, { message: 'Entitatea este obligatorie' }),
  conditions: z.record(z.any()),
  order_index: z.number().default(0),
});

// Schemă pentru action
const actionSchema = z.object({
  action_type: z.enum([
    'send_notification', 
    'change_status', 
    'assign_user', 
    'send_email', 
    'create_task', 
    'add_tag'
  ]),
  action_config: z.record(z.any()),
  order_index: z.number().default(0),
});

type AutomationFormValues = z.infer<typeof automationSchema>;
type TriggerFormValues = z.infer<typeof triggerSchema>;
type ActionFormValues = z.infer<typeof actionSchema>;

// Component pentru pagina de automatizări
export default function AutomationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [newAutomationDialogOpen, setNewAutomationDialogOpen] = useState(false);
  const [editAutomationDialogOpen, setEditAutomationDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [viewLogsDialogOpen, setViewLogsDialogOpen] = useState(false);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'automation' | 'trigger' | 'action'>('automation');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Formulare pentru creare și editare
  const automationForm = useForm<AutomationFormValues>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    },
  });

  const triggerForm = useForm<TriggerFormValues>({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      trigger_type: 'task_status_change',
      entity_type: 'task',
      conditions: {},
      order_index: 0,
    },
  });

  const actionForm = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      action_type: 'send_notification',
      action_config: {},
      order_index: 0,
    },
  });

  // Obține lista de automatizări
  const { data: automations, isLoading, error } = useQuery<Automation[]>({
    queryKey: ['/api/automations'],
    queryFn: async () => {
      const response = await fetch('/api/automations', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca automatizările');
      }
      
      return await response.json();
    }
  });

  // Mutație pentru crearea unei automatizări noi
  const createAutomationMutation = useMutation({
    mutationFn: async (data: AutomationFormValues) => {
      const response = await apiRequest('POST', '/api/automations', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Automatizare creată",
        description: "Automatizarea a fost creată cu succes",
      });
      setNewAutomationDialogOpen(false);
      setSelectedAutomation(data);
      setCurrentStep('trigger');
      setTriggerDialogOpen(true);
      automationForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea automatizarea",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru editarea unei automatizări
  const updateAutomationMutation = useMutation({
    mutationFn: async (data: AutomationFormValues & { id: number }) => {
      const { id, ...automationData } = data;
      const response = await apiRequest('PATCH', `/api/automations/${id}`, automationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Automatizare actualizată",
        description: "Automatizarea a fost actualizată cu succes",
      });
      setEditAutomationDialogOpen(false);
      setSelectedAutomation(null);
      automationForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza automatizarea",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru ștergerea unei automatizări
  const deleteAutomationMutation = useMutation({
    mutationFn: async (automationId: number) => {
      const response = await apiRequest('DELETE', `/api/automations/${automationId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Automatizare ștearsă",
        description: "Automatizarea a fost ștearsă cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge automatizarea",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru activarea/dezactivarea unei automatizări
  const toggleAutomationStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/automations/${id}`, { is_active });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status actualizat",
        description: "Statusul automatizării a fost actualizat",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza statusul automatizării",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru adăugarea unui trigger
  const addTriggerMutation = useMutation({
    mutationFn: async (data: TriggerFormValues & { automation_id: number }) => {
      const response = await apiRequest('POST', '/api/automation-triggers', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trigger adăugat",
        description: "Trigger-ul a fost adăugat cu succes",
      });
      setTriggerDialogOpen(false);
      setCurrentStep('action');
      setActionDialogOpen(true);
      triggerForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut adăuga trigger-ul",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru adăugarea unei acțiuni
  const addActionMutation = useMutation({
    mutationFn: async (data: ActionFormValues & { automation_id: number }) => {
      const response = await apiRequest('POST', '/api/automation-actions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Acțiune adăugată",
        description: "Acțiunea a fost adăugată cu succes",
      });
      setActionDialogOpen(false);
      setCurrentStep('automation');
      setSelectedAutomation(null);
      actionForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut adăuga acțiunea",
        variant: "destructive",
      });
    }
  });

  // Filtrare automatizări
  const filteredAutomations = automations?.filter(automation => {
    // Filtrare după tab
    if (activeTab === 'active' && !automation.is_active) {
      return false;
    }
    if (activeTab === 'inactive' && automation.is_active) {
      return false;
    }
    
    // Filtrare după termen de căutare
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        automation.name.toLowerCase().includes(searchLower) ||
        (automation.description && automation.description.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  }) || [];

  // Tratează crearea unei automatizări noi
  const handleCreateAutomation = (values: AutomationFormValues) => {
    createAutomationMutation.mutate(values);
  };

  // Tratează editarea unei automatizări
  const handleUpdateAutomation = (values: AutomationFormValues) => {
    if (!selectedAutomation) return;
    
    updateAutomationMutation.mutate({
      id: selectedAutomation.id,
      ...values
    });
  };

  // Tratează adăugarea unui trigger
  const handleAddTrigger = (values: TriggerFormValues) => {
    if (!selectedAutomation) return;
    
    addTriggerMutation.mutate({
      automation_id: selectedAutomation.id,
      ...values
    });
  };

  // Tratează adăugarea unei acțiuni
  const handleAddAction = (values: ActionFormValues) => {
    if (!selectedAutomation) return;
    
    addActionMutation.mutate({
      automation_id: selectedAutomation.id,
      ...values
    });
  };

  // Deschide dialogul de editare și populează formularul
  const openEditAutomationDialog = (automation: Automation) => {
    setSelectedAutomation(automation);
    
    automationForm.reset({
      name: automation.name,
      description: automation.description || '',
      is_active: automation.is_active,
    });
    
    setEditAutomationDialogOpen(true);
  };

  // Deschide dialogul de vizualizare logs
  const openViewLogsDialog = (automation: Automation) => {
    setSelectedAutomation(automation);
    setViewLogsDialogOpen(true);
  };

  // Tratează ștergerea unei automatizări
  const handleDeleteAutomation = (automationId: number) => {
    if (window.confirm('Sigur doriți să ștergeți această automatizare?')) {
      deleteAutomationMutation.mutate(automationId);
    }
  };

  // Tratează activarea/dezactivarea unei automatizări
  const handleToggleAutomationStatus = (automation: Automation) => {
    toggleAutomationStatusMutation.mutate({
      id: automation.id,
      is_active: !automation.is_active
    });
  };

  // Obține numele pentru tipul de trigger
  const getTriggerTypeName = (triggerType: AutomationTriggerType) => {
    switch (triggerType) {
      case 'task_status_change':
        return 'Schimbare status task';
      case 'deadline_approaching':
        return 'Termen limită apropiat';
      case 'invoice_overdue':
        return 'Factură restantă';
      case 'time_threshold_reached':
        return 'Prag de timp atins';
      case 'new_comment':
        return 'Comentariu nou';
      case 'file_upload':
        return 'Încărcare fișier';
      default:
        return triggerType;
    }
  };

  // Obține iconul pentru tipul de trigger
  const getTriggerTypeIcon = (triggerType: AutomationTriggerType) => {
    switch (triggerType) {
      case 'task_status_change':
        return <RefreshCcw className="h-4 w-4 text-blue-500" />;
      case 'deadline_approaching':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'invoice_overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'time_threshold_reached':
        return <Clock className="h-4 w-4 text-purple-500" />;
      case 'new_comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'file_upload':
        return <FileInput className="h-4 w-4 text-cyan-500" />;
      default:
        return <Workflow className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const MessageCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );

  // Obține numele pentru tipul de acțiune
  const getActionTypeName = (actionType: AutomationActionType) => {
    switch (actionType) {
      case 'send_notification':
        return 'Trimite notificare';
      case 'change_status':
        return 'Schimbă status';
      case 'assign_user':
        return 'Asignează utilizator';
      case 'send_email':
        return 'Trimite email';
      case 'create_task':
        return 'Creează task';
      case 'add_tag':
        return 'Adaugă etichetă';
      default:
        return actionType;
    }
  };

  // Obține iconul pentru tipul de acțiune
  const getActionTypeIcon = (actionType: AutomationActionType) => {
    switch (actionType) {
      case 'send_notification':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'change_status':
        return <RefreshCcw className="h-4 w-4 text-blue-500" />;
      case 'assign_user':
        return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case 'send_email':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'create_task':
        return <FilePlus className="h-4 w-4 text-purple-500" />;
      case 'add_tag':
        return <Tag className="h-4 w-4 text-yellow-500" />;
      default:
        return <Zap className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obține iconul pentru statusul execuției
  const getExecutionStatusIcon = (status: AutomationExecutionStatus) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obține numele entității pentru afișare
  const getEntityTypeName = (entityType: string) => {
    switch (entityType) {
      case 'task':
        return 'Task';
      case 'project':
        return 'Proiect';
      case 'invoice':
        return 'Factură';
      case 'client':
        return 'Client';
      case 'time_log':
        return 'Înregistrare timp';
      default:
        return entityType;
    }
  };

  // Formatează data pentru afișare
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMM yyyy, HH:mm', { locale: ro });
  };

  // Render card pentru o automatizare
  const renderAutomationCard = (automation: Automation) => (
    <Card key={automation.id} className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Wand2 className={`h-5 w-5 ${automation.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <CardTitle className="text-base">{automation.name}</CardTitle>
              <CardDescription className="text-xs">
                Creată pe {formatDate(automation.created_at)}
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
              <DropdownMenuItem onClick={() => openEditAutomationDialog(automation)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Editează</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleAutomationStatus(automation)}>
                {automation.is_active ? (
                  <>
                    <StopCircle className="mr-2 h-4 w-4" />
                    <span>Dezactivează</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    <span>Activează</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openViewLogsDialog(automation)}>
                <List className="mr-2 h-4 w-4" />
                <span>Vezi istoricul execuției</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteAutomation(automation.id)}
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
        {automation.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{automation.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Fără descriere</p>
        )}
        
        <div className="mt-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Trigger-uri</h4>
          <div className="flex flex-wrap gap-1">
            {automation.triggers && automation.triggers.length > 0 ? (
              automation.triggers.map((trigger) => (
                <Badge key={trigger.id} variant="outline" className="flex items-center">
                  {getTriggerTypeIcon(trigger.trigger_type)}
                  <span className="ml-1">{getTriggerTypeName(trigger.trigger_type)}</span>
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Fără trigger-uri</Badge>
            )}
          </div>
        </div>
        
        <div className="mt-2">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Acțiuni</h4>
          <div className="flex flex-wrap gap-1">
            {automation.actions && automation.actions.length > 0 ? (
              automation.actions.map((action) => (
                <Badge key={action.id} variant="outline" className="flex items-center">
                  {getActionTypeIcon(action.action_type)}
                  <span className="ml-1">{getActionTypeName(action.action_type)}</span>
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Fără acțiuni</Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex items-center justify-between w-full">
          <Badge variant={automation.is_active ? "default" : "secondary"}>
            {automation.is_active ? 'Activă' : 'Inactivă'}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => openViewLogsDialog(automation)}
          >
            <List className="h-3 w-3 mr-1" />
            Execuții
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Automatizări</h1>
          
          <div className="flex gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Caută automatizări..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={newAutomationDialogOpen} onOpenChange={setNewAutomationDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adaugă Automatizare
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adaugă Automatizare Nouă</DialogTitle>
                  <DialogDescription>
                    Creați o nouă automatizare pentru a eficientiza procesele.
                  </DialogDescription>
                </DialogHeader>
                <Form {...automationForm}>
                  <form onSubmit={automationForm.handleSubmit(handleCreateAutomation)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={automationForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nume</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Notificare termen limită aproape" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={automationForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descriere</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="O scurtă descriere a automatizării" 
                                {...field} 
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={automationForm.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Activează automatizarea</FormLabel>
                              <FormDescription>
                                Automatizarea va fi executată imediat după creare dacă este activată.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createAutomationMutation.isPending}
                      >
                        {createAutomationMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Continuă
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Dialog pentru editare automatizare */}
            <Dialog open={editAutomationDialogOpen} onOpenChange={setEditAutomationDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editare Automatizare</DialogTitle>
                  <DialogDescription>
                    Modificați detaliile automatizării.
                  </DialogDescription>
                </DialogHeader>
                <Form {...automationForm}>
                  <form onSubmit={automationForm.handleSubmit(handleUpdateAutomation)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={automationForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nume</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Notificare termen limită aproape" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={automationForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descriere</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="O scurtă descriere a automatizării" 
                                {...field} 
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={automationForm.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Activează automatizarea</FormLabel>
                              <FormDescription>
                                Automatizarea va fi executată doar dacă este activată.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={updateAutomationMutation.isPending}
                      >
                        {updateAutomationMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Salvează Modificările
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Dialog pentru adăugare trigger */}
            <Dialog open={triggerDialogOpen} onOpenChange={(open) => !open && setSelectedAutomation(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adaugă Trigger</DialogTitle>
                  <DialogDescription>
                    Definește condițiile care vor declanșa automatizarea.
                  </DialogDescription>
                </DialogHeader>
                <Form {...triggerForm}>
                  <form onSubmit={triggerForm.handleSubmit(handleAddTrigger)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={triggerForm.control}
                        name="trigger_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tip Trigger</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectează tipul de trigger" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="task_status_change">Schimbare status task</SelectItem>
                                    <SelectItem value="deadline_approaching">Termen limită apropiat</SelectItem>
                                    <SelectItem value="invoice_overdue">Factură restantă</SelectItem>
                                    <SelectItem value="time_threshold_reached">Prag de timp atins</SelectItem>
                                    <SelectItem value="new_comment">Comentariu nou</SelectItem>
                                    <SelectItem value="file_upload">Încărcare fișier</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Alegeti tipul de eveniment care va declanșa automatizarea.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={triggerForm.control}
                        name="entity_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tip Entitate</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectează tipul de entitate" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="task">Task</SelectItem>
                                    <SelectItem value="project">Proiect</SelectItem>
                                    <SelectItem value="invoice">Factură</SelectItem>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="time_log">Înregistrare timp</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Condiții specifice în funcție de tipul de trigger */}
                      {triggerForm.watch('trigger_type') === 'task_status_change' && (
                        <div className="space-y-4 rounded-md border p-4">
                          <h4 className="text-sm font-medium">Condiții de declanșare</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <FormLabel>Status inițial</FormLabel>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectează status inițial" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">De făcut</SelectItem>
                                  <SelectItem value="in_progress">În progres</SelectItem>
                                  <SelectItem value="review">În revizuire</SelectItem>
                                  <SelectItem value="done">Finalizat</SelectItem>
                                  <SelectItem value="blocked">Blocat</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <FormLabel>Status nou</FormLabel>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectează status nou" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">De făcut</SelectItem>
                                  <SelectItem value="in_progress">În progres</SelectItem>
                                  <SelectItem value="review">În revizuire</SelectItem>
                                  <SelectItem value="done">Finalizat</SelectItem>
                                  <SelectItem value="blocked">Blocat</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {triggerForm.watch('trigger_type') === 'deadline_approaching' && (
                        <div className="space-y-4 rounded-md border p-4">
                          <h4 className="text-sm font-medium">Condiții de declanșare</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <FormLabel>Zile înainte de termen</FormLabel>
                              <Input type="number" min="1" max="30" defaultValue="3" />
                            </div>
                            <div>
                              <FormLabel>Statusuri aplicabile</FormLabel>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Toate statusurile" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Toate statusurile</SelectItem>
                                  <SelectItem value="not_done">Doar necompletate</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={addTriggerMutation.isPending}
                      >
                        {addTriggerMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Continuă
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Dialog pentru adăugare acțiune */}
            <Dialog open={actionDialogOpen} onOpenChange={(open) => !open && setSelectedAutomation(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adaugă Acțiune</DialogTitle>
                  <DialogDescription>
                    Definește acțiunile care vor fi executate când trigger-ul este declanșat.
                  </DialogDescription>
                </DialogHeader>
                <Form {...actionForm}>
                  <form onSubmit={actionForm.handleSubmit(handleAddAction)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={actionForm.control}
                        name="action_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tip Acțiune</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectează tipul de acțiune" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="send_notification">Trimite notificare</SelectItem>
                                    <SelectItem value="change_status">Schimbă status</SelectItem>
                                    <SelectItem value="assign_user">Asignează utilizator</SelectItem>
                                    <SelectItem value="send_email">Trimite email</SelectItem>
                                    <SelectItem value="create_task">Creează task</SelectItem>
                                    <SelectItem value="add_tag">Adaugă etichetă</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Alegeti acțiunea care va fi executată când trigger-ul este declanșat.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Configurare specifică în funcție de tipul de acțiune */}
                      {actionForm.watch('action_type') === 'send_notification' && (
                        <div className="space-y-4 rounded-md border p-4">
                          <h4 className="text-sm font-medium">Configurare notificare</h4>
                          <div className="space-y-4">
                            <div>
                              <FormLabel>Titlu notificare</FormLabel>
                              <Input placeholder="Ex: Task-ul apropiat de termen limită" />
                            </div>
                            <div>
                              <FormLabel>Mesaj notificare</FormLabel>
                              <Textarea 
                                placeholder="Ex: Task-ul {{task.name}} are termenul limită în {{days_remaining}} zile."
                                className="min-h-[80px]"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Puteți folosi variabile între acolade duble pentru a insera date dinamice.
                              </p>
                            </div>
                            <div>
                              <FormLabel>Destinatari</FormLabel>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectează destinatarii" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="assignee">Responsabil</SelectItem>
                                  <SelectItem value="created_by">Creator</SelectItem>
                                  <SelectItem value="project_manager">Manager proiect</SelectItem>
                                  <SelectItem value="all_team">Toată echipa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {actionForm.watch('action_type') === 'change_status' && (
                        <div className="space-y-4 rounded-md border p-4">
                          <h4 className="text-sm font-medium">Configurare schimbare status</h4>
                          <div className="space-y-4">
                            <div>
                              <FormLabel>Noul status</FormLabel>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectează noul status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">De făcut</SelectItem>
                                  <SelectItem value="in_progress">În progres</SelectItem>
                                  <SelectItem value="review">În revizuire</SelectItem>
                                  <SelectItem value="done">Finalizat</SelectItem>
                                  <SelectItem value="blocked">Blocat</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={addActionMutation.isPending}
                      >
                        {addActionMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Finalizează
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Dialog pentru vizualizare logs */}
            <Dialog open={viewLogsDialogOpen} onOpenChange={setViewLogsDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Istoric Execuții - {selectedAutomation?.name}</DialogTitle>
                  <DialogDescription>
                    Urmăriți istoricul execuțiilor automatizării.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  {selectedAutomation?.logs && selectedAutomation.logs.length > 0 ? (
                    <div className="space-y-2">
                      {selectedAutomation.logs.map((log) => (
                        <Card key={log.id} className="mb-2">
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getExecutionStatusIcon(log.execution_status)}
                                <span className="font-medium">
                                  {log.execution_status === 'success' ? 'Execuție reușită' : 
                                   log.execution_status === 'failed' ? 'Execuție eșuată' : 'În așteptare'}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(log.executed_at)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-0">
                            <div className="text-sm space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Entitate:</span>
                                <span>{getEntityTypeName(log.entity_type)} (ID: {log.entity_id})</span>
                              </div>
                              {log.error_message && (
                                <div className="flex items-start gap-2">
                                  <span className="text-muted-foreground mt-0.5">Eroare:</span>
                                  <span className="text-red-600">{log.error_message}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <CalendarCheck className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-center text-muted-foreground">
                        Nu există înregistrări de execuție pentru această automatizare.
                      </p>
                    </div>
                  )}
                </ScrollArea>
                <DialogFooter>
                  <Button onClick={() => setViewLogsDialogOpen(false)}>
                    Închide
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Se încarcă automatizările...</p>
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Eroare</AlertTitle>
                    <AlertDescription>
                      {error instanceof Error ? error.message : "Nu s-au putut încărca automatizările"}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : filteredAutomations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <ZapIcon className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Nu există automatizări</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      {searchTerm 
                        ? 'Nu s-au găsit automatizări care să corespundă căutării.' 
                        : activeTab === 'all'
                          ? 'Nu aveți automatizări create încă. Creați prima dvs. automatizare cu butonul "Adaugă Automatizare".' 
                          : activeTab === 'active'
                            ? 'Nu aveți automatizări active.' 
                            : 'Nu aveți automatizări inactive.'
                      }
                    </p>
                    <Button className="mt-4" onClick={() => setNewAutomationDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Adaugă Automatizare
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAutomations.map(renderAutomationCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Sfaturi pentru Automatizări</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exemple de Automatizări Utile</CardTitle>
              </CardHeader>
              <CardContent className="pb-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm font-medium">
                      Notificare termen limită apropiat
                    </AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p className="mb-2">
                        Automatizare care notifică membrii echipei când un task are termenul limită în mai puțin de 3 zile.
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Trigger:</strong> deadline_approaching<br />
                        <strong>Acțiune:</strong> send_notification & send_email
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm font-medium">
                      Factură marcată ca restantă
                    </AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p className="mb-2">
                        Marchează automat facturile ca restante după trecerea termenului de plată și trimite un email clientului.
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Trigger:</strong> invoice_overdue<br />
                        <strong>Acțiune:</strong> change_status & send_email
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm font-medium">
                      Atribuire task-uri noi
                    </AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p className="mb-2">
                        Atribuie automat task-uri nou create către managerul de proiect sau membrii echipei în funcție de categorie.
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Trigger:</strong> task_status_change (creat → de făcut)<br />
                        <strong>Acțiune:</strong> assign_user
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cum să utilizați Automatizările</CardTitle>
              </CardHeader>
              <CardContent className="pb-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm font-medium">
                      Procesul de creare
                    </AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p>
                        Crearea unei automatizări implică trei pași: definirea automatizării (nume, descriere), configurarea trigger-ului (ce declanșează automatizarea) și configurarea acțiunilor (ce se întâmplă când se declanșează).
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm font-medium">
                      Variabile disponibile
                    </AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p className="mb-2">
                        În mesajele de notificare și email-uri, puteți folosi variabile pentru a personaliza conținutul.
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Task:</strong> {{'{{'}}task.title{{'}}'}}, {{'{{'}}task.due_date{{'}}'}}, {{'{{'}}task.assignee{{'}}'}}<br />
                        <strong>Project:</strong> {{'{{'}}project.name{{'}}'}}, {{'{{'}}project.client{{'}}'}}<br />
                        <strong>Invoice:</strong> {{'{{'}}invoice.number{{'}}'}}, {{'{{'}}invoice.amount{{'}}'}}, {{'{{'}}invoice.due_date{{'}}'}}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm font-medium">
                      Monitorizare și depanare
                    </AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p>
                        Folosiți secțiunea de Istoric Execuții pentru a vedea când s-a declanșat o automatizare, dacă a fost executată cu succes și eventualele erori apărute. Acest istoric vă ajută să depanați și să optimizați automatizările.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}