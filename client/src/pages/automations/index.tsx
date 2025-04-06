import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, FilePlus, ArchiveIcon, Settings, Search, PlusCircle, 
  Zap, ZapOff, Trash2, Edit, Copy, PlayCircle, StopCircle, 
  BellRing, UserPlus, FileCheck, Tag, Check, XCircle, AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Tipuri de date pentru automatizări
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

// Mapare pentru afișarea prietenoasă a tipurilor
const triggerTypeLabels: Record<AutomationTriggerType, string> = {
  'task_status_change': 'Schimbare status sarcină',
  'deadline_approaching': 'Termen limită apropiat',
  'invoice_overdue': 'Factură scadentă',
  'time_threshold_reached': 'Prag timp depășit',
  'new_comment': 'Comentariu nou',
  'file_upload': 'Încărcare fișier'
};

const actionTypeLabels: Record<AutomationActionType, string> = {
  'send_notification': 'Trimite notificare',
  'change_status': 'Schimbă status',
  'assign_user': 'Asignează utilizator',
  'send_email': 'Trimite email',
  'create_task': 'Creează sarcină',
  'add_tag': 'Adaugă etichetă'
};

const iconForAction: Record<AutomationActionType, React.ReactNode> = {
  'send_notification': <BellRing className="h-4 w-4" />,
  'change_status': <FileCheck className="h-4 w-4" />,
  'assign_user': <UserPlus className="h-4 w-4" />,
  'send_email': <BellRing className="h-4 w-4" />,
  'create_task': <FilePlus className="h-4 w-4" />,
  'add_tag': <Tag className="h-4 w-4" />
};

type Automation = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  updated_by: number | null;
  trigger_types: AutomationTriggerType[];
  action_types: AutomationActionType[];
  execution_count: number;
  last_execution_status: AutomationExecutionStatus | null;
  last_execution_time: string | null;
};

type AutomationAction = {
  id: number;
  automation_id: number;
  action_type: AutomationActionType;
  action_config: any;
  order_index: number;
};

type AutomationTrigger = {
  id: number;
  automation_id: number;
  trigger_type: AutomationTriggerType;
  entity_type: string;
  conditions: any;
  order_index: number;
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

export default function AutomationsPage() {
  const { toast } = useToast();
  const { user } = useAuth(); // Obținem utilizatorul autentificat aici
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newAutomation, setNewAutomation] = useState<{
    name: string;
    description: string;
    trigger_type: AutomationTriggerType | '';
    action_type: AutomationActionType | '';
  }>({
    name: '',
    description: '',
    trigger_type: '',
    action_type: ''
  });
  
  // Obținem lista de automatizări
  const { data: automations = [], isLoading, error } = useQuery({
    queryKey: ['/api/automations'],
    queryFn: async () => {
      const response = await fetch('/api/automations');
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca automatizările');
      }
      return await response.json();
    }
  });
  
  // Obținem jurnalul de execuție al automatizărilor
  const { data: automationLogsData = { logs: [], automations: [] }, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/automation-logs'],
    queryFn: async () => {
      const response = await fetch('/api/automation-logs');
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca jurnalele de automatizări');
      }
      return await response.json();
    }
  });
  
  // Extragem logurile și automatizările asociate din răspunsul API-ului
  const automationLogs = automationLogsData.logs || [];
  
  // Mutație pentru activarea/dezactivarea unei automatizări
  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      console.log(`Schimbare stare automatizare ${id} la ${is_active ? 'activă' : 'inactivă'}`);
      const response = await apiRequest('PATCH', `/api/automations/${id}`, { 
        is_active, 
        updated_by: user?.id || 1 // Folosim ID-ul utilizatorului sau un fallback de 1
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
      toast({
        title: "Automatizare actualizată",
        description: "Starea automatizării a fost actualizată cu succes."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: `Nu s-a putut actualiza automatizarea: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutație pentru crearea unei automatizări
  const createAutomationMutation = useMutation({
    mutationFn: async (automationData: typeof newAutomation) => {
      // Convertim în formatul așteptat de API
      const apiPayload = {
        name: automationData.name,
        description: automationData.description,
        is_active: true,
        organization_id: user?.organization_id || 3, // Folosim un fallback de 3 dacă user?.organization_id lipsește
        created_by: user?.id || 1, // Folosim un fallback de 1 dacă user?.id lipsește
        trigger_types: automationData.trigger_type ? [automationData.trigger_type] : [],
        action_types: automationData.action_type ? [automationData.action_type] : []
      };
      
      console.log('Creez automatizare:', apiPayload);
      const response = await apiRequest('POST', '/api/automations', apiPayload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
      toast({
        title: "Automatizare creată",
        description: "Automatizarea a fost creată cu succes."
      });
      setIsCreating(false);
      setNewAutomation({
        name: '',
        description: '',
        trigger_type: '',
        action_type: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: `Nu s-a putut crea automatizarea: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Filtrarea automatizărilor pe baza căutării
  const filteredAutomations = automations.filter((automation: Automation) => 
    automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (automation.description && automation.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  // Handle-uri pentru acțiuni
  const handleToggleAutomation = (id: number, currentState: boolean) => {
    toggleAutomationMutation.mutate({ id, is_active: !currentState });
  };
  
  const handleCreateAutomation = () => {
    if (!newAutomation.name || !newAutomation.trigger_type || !newAutomation.action_type) {
      toast({
        title: "Eroare",
        description: "Completați toate câmpurile obligatorii.",
        variant: "destructive"
      });
      return;
    }
    
    createAutomationMutation.mutate(newAutomation);
  };
  
  // Funcții helper pentru formatare
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Niciodată';
    
    try {
      const date = new Date(dateString);
      // Verificăm dacă data este validă
      if (isNaN(date.getTime())) {
        console.error(`Dată invalidă: ${dateString}`);
        return 'Dată invalidă';
      }
      return format(date, 'dd MMM yyyy, HH:mm', { locale: ro });
    } catch (error) {
      console.error(`Eroare la formatarea datei ${dateString}:`, error);
      return 'Dată invalidă';
    }
  };
  
  // Dacă se încarcă datele, afișăm un loader
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă automatizările...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Automatizări</h1>
            <p className="text-muted-foreground">
              Gestionați automatizările pentru organizația dumneavoastră
            </p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Adaugă Automatizare
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Creează automatizare</DialogTitle>
                <DialogDescription>
                  Configurați o nouă automatizare pentru organizația dumneavoastră
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nume automatizare</Label>
                  <Input 
                    id="name" 
                    value={newAutomation.name} 
                    onChange={(e) => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Notificare task-uri scadente" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Descriere</Label>
                  <Input 
                    id="description" 
                    value={newAutomation.description} 
                    onChange={(e) => setNewAutomation(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrieți scopul automatizării" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="trigger">Declanșator</Label>
                  <Select 
                    value={newAutomation.trigger_type} 
                    onValueChange={(value) => setNewAutomation(prev => ({ ...prev, trigger_type: value as AutomationTriggerType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați un declanșator" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(triggerTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="action">Acțiune</Label>
                  <Select 
                    value={newAutomation.action_type} 
                    onValueChange={(value) => setNewAutomation(prev => ({ ...prev, action_type: value as AutomationActionType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați o acțiune" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(actionTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Anulează
                </Button>
                <Button 
                  onClick={handleCreateAutomation}
                  disabled={createAutomationMutation.isPending}
                >
                  {createAutomationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Creează
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Caută automatizări..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="logs">Jurnal execuții</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {filteredAutomations.filter((a: Automation) => a.is_active).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <ZapOff className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Nu există automatizări active</h3>
                <p className="text-muted-foreground mt-1 text-center">
                  {searchQuery ? 'Nu s-a găsit nicio automatizare activă care să corespundă căutării tale.' : 'Creați o automatizare nouă sau activați o automatizare existentă.'}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreating(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Creează automatizare
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 mt-4">
                {filteredAutomations
                  .filter((a: Automation) => a.is_active)
                  .map((automation: Automation) => (
                    <Card key={automation.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{automation.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {automation.description || 'Nicio descriere'}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Switch 
                              checked={automation.is_active} 
                              onCheckedChange={() => handleToggleAutomation(automation.id, automation.is_active)}
                            />
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-1">Declanșatori:</div>
                            <div className="flex flex-wrap gap-1">
                              {automation.trigger_types.map((type, index) => (
                                <Badge key={index} variant="secondary">
                                  {triggerTypeLabels[type]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-1">Acțiuni:</div>
                            <div className="flex flex-wrap gap-1">
                              {automation.action_types.map((type, index) => (
                                <Badge key={index} variant="outline" className="flex items-center gap-1">
                                  {iconForAction[type]}
                                  {actionTypeLabels[type]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between">
                        <div className="text-xs text-muted-foreground">
                          Rulat de {automation.execution_count} ori
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {automation.last_execution_status === 'success' && (
                            <Check className="h-3 w-3 text-green-500" />
                          )}
                          {automation.last_execution_status === 'failed' && (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {automation.last_execution_status === 'pending' && (
                            <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
                          )}
                          {automation.last_execution_time && 
                            `Ultima execuție: ${formatDate(automation.last_execution_time)}`
                          }
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="inactive">
            {filteredAutomations.filter((a: Automation) => !a.is_active).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <ArchiveIcon className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Nu există automatizări inactive</h3>
                <p className="text-muted-foreground mt-1 text-center">
                  {searchQuery ? 'Nu s-a găsit nicio automatizare inactivă care să corespundă căutării tale.' : 'Toate automatizările sunt active.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 mt-4">
                {filteredAutomations
                  .filter((a: Automation) => !a.is_active)
                  .map((automation: Automation) => (
                    <Card key={automation.id} className="opacity-80">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{automation.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {automation.description || 'Nicio descriere'}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Switch 
                              checked={automation.is_active} 
                              onCheckedChange={() => handleToggleAutomation(automation.id, automation.is_active)}
                            />
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-1">Declanșatori:</div>
                            <div className="flex flex-wrap gap-1">
                              {automation.trigger_types.map((type, index) => (
                                <Badge key={index} variant="secondary">
                                  {triggerTypeLabels[type]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-1">Acțiuni:</div>
                            <div className="flex flex-wrap gap-1">
                              {automation.action_types.map((type, index) => (
                                <Badge key={index} variant="outline" className="flex items-center gap-1">
                                  {iconForAction[type]}
                                  {actionTypeLabels[type]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleToggleAutomation(automation.id, automation.is_active)}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" /> Activează
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          Creat la {formatDate(automation.created_at)}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Automatizare</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entitate</TableHead>
                    <TableHead>Data execuție</TableHead>
                    <TableHead>Detalii</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLogs ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-32">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Se încarcă jurnalul de execuții...</p>
                      </TableCell>
                    </TableRow>
                  ) : automationLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-32">
                        Nu există înregistrări în jurnalul de execuții
                      </TableCell>
                    </TableRow>
                  ) : (
                    automationLogs.map((log: AutomationLog) => {
                      // Folosim colecția de automatizări furnizată de API sau căutăm în lista principală
                      const automation = (automationLogsData.automations || []).find((a: Automation) => a.id === log.automation_id) || 
                                          automations.find((a: Automation) => a.id === log.automation_id);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{automation?.name || `Automatizare #${log.automation_id}`}</TableCell>
                          <TableCell>
                            {log.execution_status === 'success' ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Succes
                              </Badge>
                            ) : log.execution_status === 'failed' ? (
                              <Badge variant="destructive">
                                Eroare
                              </Badge>
                            ) : (
                              <Badge variant="default">
                                În curs
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{log.entity_type} #{log.entity_id}</TableCell>
                          <TableCell>{formatDate(log.executed_at)}</TableCell>
                          <TableCell>
                            {log.error_message && (
                              <span className="text-red-500 text-sm">{log.error_message}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}