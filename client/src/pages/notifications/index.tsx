import React, { useEffect, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Clock,
  Eye,
  FileText,
  Loader2,
  MailOpen,
  Calendar,
  CheckSquare,
  Users,
  Building2,
  CreditCard,
  AlertTriangle,
  Inbox,
  CheckCheck,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { format, formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

// Definirea tipurilor
type NotificationType = 'task_update' | 'invoice' | 'project' | 'comment' | 'reminder' | 'client' | 'team';

type Notification = {
  id: number;
  user_id: number;
  organization_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  entity_type: string | null;
  entity_id: number | null;
  action_url: string | null;
  created_at: string;
};

type NotificationSettings = {
  task_updates: boolean;
  invoice_reminders: boolean;
  project_updates: boolean;
  client_activities: boolean;
  team_mentions: boolean;
  email_notifications: boolean;
  daily_digest: boolean;
  browser_notifications: boolean;
};

// Helper pentru obținerea iconului potrivit pentru tipul notificării
const getNotificationIcon = (type: NotificationType, entityType?: string | null) => {
  switch (type) {
    case 'task_update':
      return <CheckSquare className="h-5 w-5 text-blue-500" />;
    case 'invoice':
      return <CreditCard className="h-5 w-5 text-green-500" />;
    case 'project':
      return <FileText className="h-5 w-5 text-purple-500" />;
    case 'comment':
      return <MailOpen className="h-5 w-5 text-yellow-500" />;
    case 'reminder':
      if (entityType === 'calendar_event') {
        return <Calendar className="h-5 w-5 text-orange-500" />;
      }
      return <Clock className="h-5 w-5 text-pink-500" />;
    case 'client':
      return <Building2 className="h-5 w-5 text-cyan-500" />;
    case 'team':
      return <Users className="h-5 w-5 text-indigo-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

// Component principal pentru pagina de notificări
export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obține lista de notificări
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca notificările');
      }
      
      return await response.json();
    }
  });

  // Obține setările notificărilor
  const { data: notificationSettings, isLoading: isLoadingSettings } = useQuery<NotificationSettings>({
    queryKey: ['/api/notifications/settings'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/settings', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca setările notificărilor');
      }
      
      return await response.json();
    }
  });

  // Mutație pentru marcarea notificărilor ca citite
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: number[]) => {
      const response = await apiRequest('PATCH', '/api/notifications/mark-read', { notificationIds });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notificări actualizate",
        description: "Notificările au fost marcate ca citite",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setSelectedNotifications([]);
      setSelectAll(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut actualiza notificările",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru marcarea unei singure notificări ca citită
  const markOneAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('PATCH', `/api/notifications/${notificationId}/mark-read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza notificarea",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru ștergerea notificărilor
  const deleteNotificationsMutation = useMutation({
    mutationFn: async (notificationIds: number[]) => {
      const response = await apiRequest('DELETE', '/api/notifications', { notificationIds });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notificări șterse",
        description: "Notificările selectate au fost șterse",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setSelectedNotifications([]);
      setSelectAll(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut șterge notificările",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru actualizarea setărilor notificărilor
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const response = await apiRequest('PATCH', '/api/notifications/settings', settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Setări actualizate",
        description: "Setările notificărilor au fost actualizate",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut actualiza setările",
        variant: "destructive",
      });
    }
  });

  // Filtrarea notificărilor în funcție de tab-ul activ
  const filteredNotifications = notifications?.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.is_read;
    return notification.notification_type === activeTab;
  }) || [];

  // Selectează/deselectează toate notificările
  useEffect(() => {
    if (selectAll) {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  }, [selectAll, filteredNotifications]);

  // Handler pentru schimbarea stării unui checkbox
  const handleCheckboxChange = (notificationId: number, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, notificationId]);
    } else {
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    }
  };

  // Handler pentru marcarea notificărilor ca citite
  const handleMarkAsRead = () => {
    if (selectedNotifications.length === 0) return;
    markAsReadMutation.mutate(selectedNotifications);
  };

  // Handler pentru ștergerea notificărilor
  const handleDeleteNotifications = () => {
    if (selectedNotifications.length === 0) return;
    deleteNotificationsMutation.mutate(selectedNotifications);
  };

  // Handler pentru actualizarea unei setări
  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  // Funcția pentru formatarea timpului relativ
  const getRelativeTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ro });
  };

  // Calculează numărul de notificări pe categorii
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const taskCount = notifications?.filter(n => n.notification_type === 'task_update').length || 0;
  const invoiceCount = notifications?.filter(n => n.notification_type === 'invoice').length || 0;
  const projectCount = notifications?.filter(n => n.notification_type === 'project').length || 0;
  const reminderCount = notifications?.filter(n => n.notification_type === 'reminder').length || 0;

  // Render notificarea
  const renderNotification = (notification: Notification) => (
    <div 
      key={notification.id} 
      className={`flex items-start p-4 gap-3 border-b hover:bg-accent/20 transition-colors ${notification.is_read ? '' : 'bg-accent/10'}`}
    >
      <div className="flex-shrink-0 pt-0.5">
        <Checkbox 
          checked={selectedNotifications.includes(notification.id)}
          onCheckedChange={(checked) => handleCheckboxChange(notification.id, !!checked)}
          aria-label="Selectează notificarea"
        />
      </div>
      
      <div className="flex-shrink-0">
        {getNotificationIcon(notification.notification_type, notification.entity_type)}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium line-clamp-1">
            {notification.title}
          </div>
          <div className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {getRelativeTime(notification.created_at)}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          {notification.message}
        </p>
        
        <div className="flex justify-between items-center mt-2">
          {notification.action_url && (
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <Link href={notification.action_url}>
                Vezi detalii
              </Link>
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            {!notification.is_read && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => markOneAsReadMutation.mutate(notification.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="sr-only">Marchează ca citit</span>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Acțiuni</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.is_read && (
                  <DropdownMenuItem 
                    onClick={() => markOneAsReadMutation.mutate(notification.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Marchează ca citit</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => deleteNotificationsMutation.mutate([notification.id])}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Șterge notificarea</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Notificări</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between flex-col sm:flex-row gap-4">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1.5">
                <Inbox className="h-4 w-4" />
                <span>Toate</span>
                {notifications && (
                  <Badge variant="secondary" className="ml-1">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center gap-1.5">
                <MailOpen className="h-4 w-4" />
                <span>Necitite</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              {taskCount > 0 && (
                <TabsTrigger value="task_update" className="flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4" />
                  <span>Task-uri</span>
                  <Badge variant="secondary" className="ml-1">
                    {taskCount}
                  </Badge>
                </TabsTrigger>
              )}
              {invoiceCount > 0 && (
                <TabsTrigger value="invoice" className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  <span>Facturi</span>
                  <Badge variant="secondary" className="ml-1">
                    {invoiceCount}
                  </Badge>
                </TabsTrigger>
              )}
              {projectCount > 0 && (
                <TabsTrigger value="project" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>Proiecte</span>
                  <Badge variant="secondary" className="ml-1">
                    {projectCount}
                  </Badge>
                </TabsTrigger>
              )}
              {reminderCount > 0 && (
                <TabsTrigger value="reminder" className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Mementouri</span>
                  <Badge variant="secondary" className="ml-1">
                    {reminderCount}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsRead}
                disabled={selectedNotifications.length === 0 || markAsReadMutation.isPending}
              >
                {markAsReadMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <CheckCheck className="mr-2 h-4 w-4" />
                Marchează ca citite
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteNotifications}
                disabled={selectedNotifications.length === 0 || deleteNotificationsMutation.isPending}
                className="text-red-600"
              >
                {deleteNotificationsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Trash2 className="mr-2 h-4 w-4" />
                Șterge
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-2">
              <TabsContent value={activeTab} className="m-0">
                {isLoading ? (
                  <CardContent className="p-8 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Se încarcă notificările...</p>
                  </CardContent>
                ) : error ? (
                  <CardContent className="p-6">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Eroare</AlertTitle>
                      <AlertDescription>
                        {error instanceof Error ? error.message : "Nu s-au putut încărca notificările"}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                ) : filteredNotifications.length === 0 ? (
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Nu există notificări</h3>
                      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                        {activeTab === 'all' 
                          ? 'Nu aveți notificări în acest moment.' 
                          : activeTab === 'unread' 
                            ? 'Nu aveți notificări necitite în acest moment.' 
                            : `Nu aveți notificări de tipul ${activeTab} în acest moment.`}
                      </p>
                    </div>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="pb-0 pt-6">
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {activeTab === 'all' ? 'Toate notificările' : 
                          activeTab === 'unread' ? 'Notificări necitite' : 
                          activeTab === 'task_update' ? 'Notificări task-uri' :
                          activeTab === 'invoice' ? 'Notificări facturi' :
                          activeTab === 'project' ? 'Notificări proiecte' :
                          activeTab === 'reminder' ? 'Mementouri' :
                          activeTab === 'client' ? 'Notificări clienți' :
                          'Notificări echipă'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="select-all"
                            checked={selectAll}
                            onCheckedChange={setSelectAll}
                          />
                          <Label htmlFor="select-all" className="text-sm">Selectează tot</Label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 pt-4">
                      <ScrollArea className="h-[65vh]">
                        <div className="flex flex-col divide-y">
                          {filteredNotifications.map(renderNotification)}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </>
                )}
              </TabsContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Setări Notificări</CardTitle>
                <CardDescription>
                  Personalizează modul în care primești notificările
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Tipuri de notificări</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-blue-500" />
                            <Label className="text-sm">Actualizări task-uri</Label>
                          </div>
                          <Switch 
                            checked={notificationSettings?.task_updates ?? true}
                            onCheckedChange={(checked) => handleSettingChange('task_updates', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-green-500" />
                            <Label className="text-sm">Memento facturi</Label>
                          </div>
                          <Switch 
                            checked={notificationSettings?.invoice_reminders ?? true}
                            onCheckedChange={(checked) => handleSettingChange('invoice_reminders', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            <Label className="text-sm">Actualizări proiecte</Label>
                          </div>
                          <Switch 
                            checked={notificationSettings?.project_updates ?? true}
                            onCheckedChange={(checked) => handleSettingChange('project_updates', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-cyan-500" />
                            <Label className="text-sm">Activități clienți</Label>
                          </div>
                          <Switch 
                            checked={notificationSettings?.client_activities ?? true}
                            onCheckedChange={(checked) => handleSettingChange('client_activities', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-500" />
                            <Label className="text-sm">Mențiuni echipă</Label>
                          </div>
                          <Switch 
                            checked={notificationSettings?.team_mentions ?? true}
                            onCheckedChange={(checked) => handleSettingChange('team_mentions', checked)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Canale de notificare</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Email</Label>
                          <Switch 
                            checked={notificationSettings?.email_notifications ?? true}
                            onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Sumar zilnic</Label>
                          <Switch 
                            checked={notificationSettings?.daily_digest ?? false}
                            onCheckedChange={(checked) => handleSettingChange('daily_digest', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Notificări browser</Label>
                          <Switch 
                            checked={notificationSettings?.browser_notifications ?? true}
                            onCheckedChange={(checked) => handleSettingChange('browser_notifications', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}