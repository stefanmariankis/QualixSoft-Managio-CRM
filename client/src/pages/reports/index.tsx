import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Download, FileText, PieChart, BarChart, TrendingUp, Clock, Users, DownloadCloud } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

// Tipuri pentru datele de raport
interface FinancialData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

interface ClientRevenueData {
  name: string;
  value: number;
}

interface TimeTrackingData {
  name: string;
  billable: number;
  nonBillable: number;
}

interface TeamPerformanceData {
  name: string;
  tasks: number;
  completion: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9966FF', '#FF6666', '#66CCFF'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string>('financial');
  const [reportPeriod, setReportPeriod] = useState<string>('current_month');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Obținem datele pentru raportul financiar
  const { data: financialData, isLoading: isFinancialLoading } = useQuery<FinancialData[]>({
    queryKey: ['/api/reports/financial', reportPeriod, customDateRange],
    queryFn: async () => {
      // Aici ar trebui să fie o cerere reală la API
      return [
        { month: 'Ian', income: 15000, expenses: 10000, profit: 5000 },
        { month: 'Feb', income: 18000, expenses: 11000, profit: 7000 },
        { month: 'Mar', income: 21000, expenses: 12000, profit: 9000 },
        { month: 'Apr', income: 25000, expenses: 13000, profit: 12000 },
        { month: 'Mai', income: 23000, expenses: 14000, profit: 9000 },
        { month: 'Iun', income: 28000, expenses: 15000, profit: 13000 },
        { month: 'Iul', income: 32000, expenses: 16000, profit: 16000 },
        { month: 'Aug', income: 27000, expenses: 15000, profit: 12000 },
        { month: 'Sep', income: 30000, expenses: 16000, profit: 14000 },
        { month: 'Oct', income: 35000, expenses: 17000, profit: 18000 },
        { month: 'Nov', income: 31000, expenses: 16000, profit: 15000 },
        { month: 'Dec', income: 39000, expenses: 18000, profit: 21000 },
      ];
    }
  });

  // Obținem datele pentru statusul proiectelor
  const { data: projectStatusData, isLoading: isProjectStatusLoading } = useQuery<ProjectStatusData[]>({
    queryKey: ['/api/reports/project-status', reportPeriod, customDateRange],
    queryFn: async () => {
      // Aici ar trebui să fie o cerere reală la API
      return [
        { name: 'În progres', value: 7, color: '#3B82F6' },
        { name: 'Planificat', value: 3, color: '#9CA3AF' },
        { name: 'Finalizat', value: 12, color: '#10B981' },
        { name: 'Blocat', value: 2, color: '#EF4444' },
        { name: 'În așteptare', value: 5, color: '#F59E0B' },
      ];
    }
  });

  // Obținem datele pentru veniturile pe clienți
  const { data: clientRevenueData, isLoading: isClientRevenueLoading } = useQuery<ClientRevenueData[]>({
    queryKey: ['/api/reports/client-revenue', reportPeriod, customDateRange],
    queryFn: async () => {
      // Aici ar trebui să fie o cerere reală la API
      return [
        { name: 'Innovate SRL', value: 25000 },
        { name: 'TechSolutions', value: 18000 },
        { name: 'MediaGroup', value: 15000 },
        { name: 'EShop Direct', value: 12000 },
        { name: 'FinConsult', value: 10000 },
        { name: 'Alții', value: 20000 },
      ];
    }
  });

  // Obținem datele pentru înregistrarea timpului
  const { data: timeTrackingData, isLoading: isTimeTrackingLoading } = useQuery<TimeTrackingData[]>({
    queryKey: ['/api/reports/time-tracking', reportPeriod, customDateRange],
    queryFn: async () => {
      // Aici ar trebui să fie o cerere reală la API
      return [
        { name: 'Lun', billable: 6, nonBillable: 2 },
        { name: 'Mar', billable: 7, nonBillable: 1 },
        { name: 'Mie', billable: 8, nonBillable: 1.5 },
        { name: 'Joi', billable: 7.5, nonBillable: 1 },
        { name: 'Vin', billable: 6, nonBillable: 2 },
        { name: 'Sâm', billable: 3, nonBillable: 1 },
        { name: 'Dum', billable: 2, nonBillable: 0.5 },
      ];
    }
  });

  // Obținem datele pentru performanța echipei
  const { data: teamPerformanceData, isLoading: isTeamPerformanceLoading } = useQuery<TeamPerformanceData[]>({
    queryKey: ['/api/reports/team-performance', reportPeriod, customDateRange],
    queryFn: async () => {
      // Aici ar trebui să fie o cerere reală la API
      return [
        { name: 'Alex P.', tasks: 18, completion: 94 },
        { name: 'Maria I.', tasks: 15, completion: 87 },
        { name: 'Ioan S.', tasks: 12, completion: 91 },
        { name: 'Elena D.', tasks: 20, completion: 85 },
        { name: 'Radu M.', tasks: 14, completion: 93 },
      ];
    }
  });

  // Handler pentru schimbarea perioadei
  const handlePeriodChange = (value: string) => {
    setReportPeriod(value);
    
    // Actualizăm intervalul personalizat pentru afișarea calendarului
    if (value === 'custom') {
      setCalendarOpen(true);
    } else {
      let fromDate, toDate;
      
      switch (value) {
        case 'current_month':
          fromDate = startOfMonth(new Date());
          toDate = endOfMonth(new Date());
          break;
        case 'previous_month':
          fromDate = startOfMonth(subMonths(new Date(), 1));
          toDate = endOfMonth(subMonths(new Date(), 1));
          break;
        case 'last_3_months':
          fromDate = startOfMonth(subMonths(new Date(), 2));
          toDate = endOfMonth(new Date());
          break;
        case 'last_6_months':
          fromDate = startOfMonth(subMonths(new Date(), 5));
          toDate = endOfMonth(new Date());
          break;
        case 'year_to_date':
          fromDate = new Date(new Date().getFullYear(), 0, 1);
          toDate = new Date();
          break;
        default:
          fromDate = startOfMonth(new Date());
          toDate = endOfMonth(new Date());
      }
      
      setCustomDateRange({ from: fromDate, to: toDate });
    }
  };

  // Funcție pentru generarea raportului
  const handleGenerateReport = () => {
    // Aici ar trebui să fie o cerere reală pentru generarea raportului
    console.log('Generare raport:', {
      type: activeTab,
      period: reportPeriod,
      dateRange: reportPeriod === 'custom' ? customDateRange : null,
      format: reportFormat,
    });
    
    alert(`Raport ${activeTab} generat în format ${reportFormat.toUpperCase()}`);
  };

  // Formatare date pentru afișare
  const formatDate = (date: Date) => {
    return format(date, 'd MMM yyyy', { locale: ro });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Rapoarte</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează perioada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Luna curentă</SelectItem>
                  <SelectItem value="previous_month">Luna precedentă</SelectItem>
                  <SelectItem value="last_3_months">Ultimele 3 luni</SelectItem>
                  <SelectItem value="last_6_months">Ultimele 6 luni</SelectItem>
                  <SelectItem value="year_to_date">Anul curent</SelectItem>
                  <SelectItem value="custom">Interval personalizat</SelectItem>
                </SelectContent>
              </Select>
              
              {reportPeriod === 'custom' && (
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          <>
                            {formatDate(customDateRange.from)} - {formatDate(customDateRange.to)}
                          </>
                        ) : (
                          formatDate(customDateRange.from)
                        )
                      ) : (
                        <span>Selectează datele</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange.from}
                      selected={{
                        from: customDateRange.from,
                        to: customDateRange.to,
                      }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setCustomDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
              
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează formatul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="flex-shrink-0" onClick={handleGenerateReport}>
              <DownloadCloud className="mr-2 h-4 w-4" /> Generează Raport
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="financial" className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" /> Financiar
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center">
              <PieChart className="mr-2 h-4 w-4" /> Proiecte
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center">
              <BarChart className="mr-2 h-4 w-4" /> Clienți
            </TabsTrigger>
            <TabsTrigger value="time" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" /> Timp
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center">
              <Users className="mr-2 h-4 w-4" /> Echipă
            </TabsTrigger>
          </TabsList>
          
          {/* Raport financiar */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Venituri totale</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isFinancialLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      `${financialData?.reduce((sum, item) => sum + item.income, 0).toLocaleString()} RON`
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cheltuieli totale</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isFinancialLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      `${financialData?.reduce((sum, item) => sum + item.expenses, 0).toLocaleString()} RON`
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Profit total</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isFinancialLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      `${financialData?.reduce((sum, item) => sum + item.profit, 0).toLocaleString()} RON`
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Evoluție financiară</CardTitle>
                <CardDescription>Venituri, cheltuieli și profit pe luni</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isFinancialLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={financialData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `${value.toLocaleString()} RON`}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Venituri" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Cheltuieli" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Raport proiecte */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Număr total proiecte</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isProjectStatusLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      projectStatusData?.reduce((sum, item) => sum + item.value, 0)
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Proiecte active</CardTitle>
                  <CardDescription>În progres + Planificate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isProjectStatusLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      projectStatusData?.filter(p => p.name === 'În progres' || p.name === 'Planificat').reduce((sum, item) => sum + item.value, 0)
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Proiecte finalizate</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isProjectStatusLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      projectStatusData?.filter(p => p.name === 'Finalizat').reduce((sum, item) => sum + item.value, 0)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuție proiecte după status</CardTitle>
                <CardDescription>Număr de proiecte în fiecare status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isProjectStatusLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {projectStatusData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value} />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Raport clienți */}
          <TabsContent value="clients" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Număr total clienți</CardTitle>
                  <CardDescription>Cu proiecte active</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isClientRevenueLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      clientRevenueData?.length || 0
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Venit mediu per client</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isClientRevenueLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      `${Math.round(clientRevenueData?.reduce((sum, item) => sum + item.value, 0) / clientRevenueData?.length).toLocaleString()} RON`
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top client</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {isClientRevenueLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      clientRevenueData?.sort((a, b) => b.value - a.value)[0]?.name
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isClientRevenueLoading ? (
                      <div className="animate-pulse bg-muted h-4 w-24 rounded mt-1" />
                    ) : (
                      `${clientRevenueData?.sort((a, b) => b.value - a.value)[0]?.value.toLocaleString()} RON`
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuție venituri pe clienți</CardTitle>
                <CardDescription>Venituri totale pentru fiecare client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isClientRevenueLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={clientRevenueData}
                        layout="vertical"
                        margin={{
                          top: 20,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip 
                          formatter={(value: number) => `${value.toLocaleString()} RON`}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Venituri" 
                          fill="#3B82F6" 
                          radius={[0, 4, 4, 0]} 
                        >
                          {clientRevenueData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Raport timp */}
          <TabsContent value="time" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ore totale</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isTimeTrackingLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      timeTrackingData?.reduce((sum, item) => sum + item.billable + item.nonBillable, 0).toFixed(1)
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ore facturabile</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isTimeTrackingLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      timeTrackingData?.reduce((sum, item) => sum + item.billable, 0).toFixed(1)
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Raport facturabil</CardTitle>
                  <CardDescription>Procent ore facturabile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isTimeTrackingLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      `${Math.round(
                        (timeTrackingData?.reduce((sum, item) => sum + item.billable, 0) /
                        timeTrackingData?.reduce((sum, item) => sum + item.billable + item.nonBillable, 0)) * 100
                      )}%`
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuție timp</CardTitle>
                <CardDescription>Ore facturabile vs. nefacturabile pe zile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isTimeTrackingLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={timeTrackingData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `${value} ore`}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <Legend />
                        <Bar dataKey="billable" name="Ore facturabile" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="nonBillable" name="Ore nefacturabile" stackId="a" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Raport echipă */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Număr total task-uri</CardTitle>
                  <CardDescription>Perioada selectată</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isTeamPerformanceLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      teamPerformanceData?.reduce((sum, item) => sum + item.tasks, 0)
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Rata medie de completare</CardTitle>
                  <CardDescription>Procent task-uri finalizate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isTeamPerformanceLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      `${Math.round(
                        teamPerformanceData?.reduce((sum, item) => sum + item.completion, 0) / teamPerformanceData?.length
                      )}%`
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Membru top</CardTitle>
                  <CardDescription>După rata de completare</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {isTeamPerformanceLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-32 rounded" />
                    ) : (
                      teamPerformanceData?.sort((a, b) => b.completion - a.completion)[0]?.name
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isTeamPerformanceLoading ? (
                      <div className="animate-pulse bg-muted h-4 w-24 rounded mt-1" />
                    ) : (
                      `${teamPerformanceData?.sort((a, b) => b.completion - a.completion)[0]?.completion}% completare`
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Performanța echipei</CardTitle>
                <CardDescription>Task-uri și rata de completare per membru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isTeamPerformanceLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={teamPerformanceData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === 'tasks' ? `${value} task-uri` : `${value}%`,
                            name === 'tasks' ? 'Task-uri' : 'Rata completare'
                          ]}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="tasks" name="Task-uri" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="completion" name="Rata completare" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}