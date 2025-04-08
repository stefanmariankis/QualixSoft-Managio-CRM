import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Plus, BarChart, AlarmClock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import TimeTrackingModal from "@/components/time-tracking/time-tracking-modal";

// Pagina de time tracking simplificată
export default function TimeTrackingPage() {
  const [activeTab, setActiveTab] = useState("logs");
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  
  // Datele de time tracking
  const { data: timeLogs, isLoading } = useQuery({
    queryKey: ['/api/time-logs'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/time-logs');
        if (!response.ok) {
          throw new Error('Nu s-au putut încărca datele');
        }
        return await response.json();
      } catch (error) {
        console.error('Eroare la încărcarea înregistrărilor de timp:', error);
        return [];
      }
    }
  });
  
  // Formatează durata în ore și minute
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Calculează statistici
  const calculateStats = () => {
    if (!timeLogs || !Array.isArray(timeLogs)) return { total: 0, billable: 0, nonBillable: 0 };
    
    let total = 0;
    let billable = 0;
    
    timeLogs.forEach((log: any) => {
      const duration = log.duration_minutes || 0;
      total += duration;
      
      if (log.is_billable) {
        billable += duration;
      }
    });
    
    return {
      total: total / 60,
      billable: billable / 60,
      nonBillable: (total - billable) / 60
    };
  };
  
  const stats = calculateStats();
  
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monitorizare Timp</h1>
            <p className="text-muted-foreground">
              Monitorizează și gestionează timpul de lucru pentru toate proiectele
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="w-full sm:w-auto"
              onClick={() => setIsTimerModalOpen(true)}
            >
              <AlarmClock className="mr-2 h-4 w-4" />
              Pornește timp
            </Button>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => setIsManualModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adaugă manual
            </Button>
          </div>
        </div>
        
        {/* Modaluri */}
        <TimeTrackingModal
          open={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          isTimer={true}
        />
        
        <TimeTrackingModal
          open={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          isTimer={false}
        />
        
        {/* Statistici */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total ore</CardTitle>
              <CardDescription>Toate orele înregistrate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total.toFixed(1)}</div>
              <p className="text-muted-foreground text-sm">
                {timeLogs && Array.isArray(timeLogs) ? timeLogs.length : 0} înregistrări
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ore facturabile</CardTitle>
              <CardDescription>Orele care pot fi facturate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.billable.toFixed(1)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ore nefacturabile</CardTitle>
              <CardDescription>Orele care nu pot fi facturate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.nonBillable.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs pentru înregistrări și rapoarte */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="logs">
              <Clock className="mr-2 h-4 w-4" />
              Înregistrări timp
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart className="mr-2 h-4 w-4" />
              Rapoarte
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="mt-6">
            {timeLogs && Array.isArray(timeLogs) && timeLogs.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Proiect</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Descriere</TableHead>
                      <TableHead>Utilizator</TableHead>
                      <TableHead>Durată</TableHead>
                      <TableHead>Facturabil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.date).toLocaleDateString('ro-RO')}
                          {log.start_time && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.start_time).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                              {log.end_time && ` - ${new Date(log.end_time).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{log.project_name || 'Necunoscut'}</TableCell>
                        <TableCell>{log.task_title || '-'}</TableCell>
                        <TableCell>{log.description || '-'}</TableCell>
                        <TableCell>{log.user_name || 'Necunoscut'}</TableCell>
                        <TableCell>{formatDuration(log.duration_minutes || 0)}</TableCell>
                        <TableCell>
                          {log.is_billable ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Da
                            </Badge>
                          ) : (
                            <Badge variant="outline">Nu</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Clock className="h-16 w-16 text-muted-foreground opacity-80" />
                  <h3 className="mt-4 text-xl font-medium">Nicio înregistrare de timp</h3>
                  <p className="mt-2 text-center text-muted-foreground max-w-sm">
                    Nu există înregistrări de timp. Poți începe să cronometrezi timpul sau să adaugi înregistrări manual.
                  </p>
                  <Button 
                    className="mt-6"
                    onClick={() => setIsManualModalOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adaugă prima înregistrare
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rapoarte de timp</CardTitle>
                <CardDescription>
                  Vizualizează rapoarte detaliate despre timpul înregistrat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Secțiunea de rapoarte va fi disponibilă în curând.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar de timp</CardTitle>
                <CardDescription>
                  Vizualizează înregistrările de timp într-un calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Calendarul de timp va fi disponibil în curând.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}