import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, Info, DollarSign, Clock, Calendar, PieChart, BarChart3, Users, Building2, FileText } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  Line, 
  LineChart, 
  Bar, 
  BarChart, 
  Pie, 
  PieChart as RechartsPieChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Tipuri de date
type RevenueData = {
  name: string;
  paid: number;
  unpaid: number;
  total: number;
}

type ProjectStatusData = {
  name: string;
  value: number;
  color: string;
}

type ClientRevenueData = {
  id: number;
  name: string;
  revenue: number;
  projects: number;
  invoices: number;
  percentChange: number;
}

type TaskStatusData = {
  name: string;
  value: number;
  color: string;
}

type TimeDistributionData = {
  name: string;
  hours: number;
  billable_hours: number;
  billable_percentage: number;
}

type UserProductivityData = {
  id: number;
  name: string;
  tasks_completed: number;
  hours_logged: number;
  billable_hours: number;
  efficiency: number;
  revenue_generated: number;
}

type ProjectPerformanceData = {
  id: number;
  name: string;
  client_name: string;
  budget: number | null;
  cost: number;
  revenue: number;
  profit: number;
  margin: number;
  status: string;
}

type FinancialMetrics = {
  total_revenue: number;
  total_expenses: number;
  profit: number;
  margin: number;
  average_invoice_value: number;
  payment_collection_time: number;
  outstanding_invoices: number;
  outstanding_amount: number;
}

type ReportsData = {
  revenue_data: RevenueData[];
  project_status_data: ProjectStatusData[];
  client_revenue_data: ClientRevenueData[];
  task_status_data: TaskStatusData[];
  time_distribution_data: TimeDistributionData[];
  user_productivity_data: UserProductivityData[];
  project_performance_data: ProjectPerformanceData[];
  financial_metrics: FinancialMetrics;
}

// Piecharts color theme
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#F66B0E', '#205375', '#FF6B6B', '#56CBF9'
];

// Component pentru afișarea unui placeholder când datele se încarcă sau există eroare
function ReportPlaceholder({ isLoading, error }: { isLoading: boolean; error: Error | null }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Se încarcă datele raportului...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert className="mx-auto max-w-md" variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Eroare</AlertTitle>
        <AlertDescription>
          {error.message || "Nu s-au putut încărca datele pentru raport"}
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}

// Component pentru tab-ul de rapoarte financiare
function FinancialReports({ data, isLoading, error }: { data: ReportsData | undefined; isLoading: boolean; error: Error | null }) {
  const [period, setPeriod] = useState<string>('last6Months');
  
  if (isLoading || error || !data) {
    return <ReportPlaceholder isLoading={isLoading} error={error} />;
  }
  
  const { revenue_data, client_revenue_data, financial_metrics } = data;
  
  // Formatare sume financiare
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', { 
      style: 'currency', 
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Raport Financiar</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selectează perioada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last3Months">Ultimele 3 luni</SelectItem>
            <SelectItem value="last6Months">Ultimele 6 luni</SelectItem>
            <SelectItem value="last12Months">Ultimele 12 luni</SelectItem>
            <SelectItem value="currentYear">Anul curent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Metrici financiare principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>Venituri totale</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold">
              {formatCurrency(financial_metrics.total_revenue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {financial_metrics.outstanding_invoices} facturi neîncasate: {formatCurrency(financial_metrics.outstanding_amount)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Profit</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold">
              {formatCurrency(financial_metrics.profit)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Marjă de profit: {formatPercentage(financial_metrics.margin)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Valoare medie factură</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold">
              {formatCurrency(financial_metrics.average_invoice_value)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Timp mediu de încasare: {financial_metrics.payment_collection_time} zile
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                <span>Cheltuieli</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold">
              {formatCurrency(financial_metrics.total_expenses)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatPercentage(financial_metrics.total_expenses / financial_metrics.total_revenue * 100)} din venituri
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Grafic venituri */}
      <Card>
        <CardHeader>
          <CardTitle>Evoluție venituri</CardTitle>
          <CardDescription>
            Analiza veniturilor încasate și neîncasate pe ultimele luni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenue_data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorUnpaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8042" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF8042" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('ro-RO', { 
                      style: 'currency', 
                      currency: 'RON',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                      notation: 'compact',
                      compactDisplay: 'short'
                    }).format(value)
                  } 
                />
                <Tooltip 
                  formatter={(value: number) => [
                    formatCurrency(value), 
                    value === revenue_data[0]?.paid ? "Încasat" : "Neîncasat"
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="paid" 
                  name="Încasat" 
                  stroke="#0088FE" 
                  fillOpacity={1} 
                  fill="url(#colorPaid)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="unpaid" 
                  name="Neîncasat" 
                  stroke="#FF8042" 
                  fillOpacity={1}
                  fill="url(#colorUnpaid)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Top clienți după venituri */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clienți după Venituri</CardTitle>
          <CardDescription>
            Clasificarea clienților în funcție de veniturile generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Proiecte</TableHead>
                  <TableHead className="text-right">Facturi</TableHead>
                  <TableHead className="text-right">Venituri</TableHead>
                  <TableHead className="text-right">Variație</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client_revenue_data.slice(0, 5).map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-right">{client.projects}</TableCell>
                    <TableCell className="text-right">{client.invoices}</TableCell>
                    <TableCell className="text-right">{formatCurrency(client.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        {client.percentChange > 0 ? (
                          <>
                            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                            <span className="text-green-500">+{client.percentChange}%</span>
                          </>
                        ) : client.percentChange < 0 ? (
                          <>
                            <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                            <span className="text-red-500">{client.percentChange}%</span>
                          </>
                        ) : (
                          <span>0%</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Performanța proiectelor */}
      <Card>
        <CardHeader>
          <CardTitle>Performanța Proiectelor</CardTitle>
          <CardDescription>
            Analiza profitabilității și a eficienței proiectelor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proiect</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Venituri</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Marjă</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.project_performance_data.slice(0, 6).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.client_name}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          project.status === 'în progres' 
                            ? 'bg-blue-100 text-blue-800' 
                            : project.status === 'finalizat' 
                              ? 'bg-green-100 text-green-800' 
                              : project.status === 'anulat' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{project.budget ? formatCurrency(project.budget) : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.cost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <span className={project.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(project.profit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={project.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(project.margin)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component pentru tab-ul de rapoarte de productivitate
function ProductivityReports({ data, isLoading, error }: { data: ReportsData | undefined; isLoading: boolean; error: Error | null }) {
  
  if (isLoading || error || !data) {
    return <ReportPlaceholder isLoading={isLoading} error={error} />;
  }
  
  const { task_status_data, time_distribution_data, user_productivity_data } = data;
  
  // Formatare ore și procente
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };
  
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Raport Productivitate</h2>
      
      {/* Metrici principale productivitate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Status Task-uri</CardTitle>
            <CardDescription>
              Distribuția task-urilor după status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[250px] w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={task_status_data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {task_status_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} task-uri`, "Cantitate"]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Distribuția Timpului de Lucru</CardTitle>
            <CardDescription>
              Analiza orelor lucrate pe categorii de activități
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={time_distribution_data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => `${value}h`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'hours' ? `${value}h` : name === 'billable_hours' ? `${value}h` : `${value}%`,
                      name === 'hours' ? 'Total ore' : name === 'billable_hours' ? 'Ore facturabile' : 'Procent facturabil'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="hours" 
                    name="Total ore" 
                    fill="#8884d8" 
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="billable_hours" 
                    name="Ore facturabile" 
                    fill="#82ca9d" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="billable_percentage" 
                    name="Procent facturabil" 
                    stroke="#ff7300"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Productivitatea pe utilizatori */}
      <Card>
        <CardHeader>
          <CardTitle>Productivitatea Utilizatorilor</CardTitle>
          <CardDescription>
            Performanța membrilor echipei în funcție de task-uri finalizate și ore lucrate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizator</TableHead>
                  <TableHead className="text-right">Task-uri Finalizate</TableHead>
                  <TableHead className="text-right">Ore Lucrate</TableHead>
                  <TableHead className="text-right">Ore Facturabile</TableHead>
                  <TableHead className="text-right">Eficiență</TableHead>
                  <TableHead className="text-right">Venituri Generate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user_productivity_data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-right">{user.tasks_completed}</TableCell>
                    <TableCell className="text-right">{formatHours(user.hours_logged)}</TableCell>
                    <TableCell className="text-right">
                      {formatHours(user.billable_hours)} ({formatPercentage(user.billable_hours / user.hours_logged * 100)})
                    </TableCell>
                    <TableCell className="text-right">{formatPercentage(user.efficiency)}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('ro-RO', { 
                        style: 'currency', 
                        currency: 'RON',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(user.revenue_generated)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Grafic eficiență pe proiecte */}
      <Card>
        <CardHeader>
          <CardTitle>Eficiența Proiectelor</CardTitle>
          <CardDescription>
            Raportul între buget, cost și venituri pe proiecte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.project_performance_data.slice(0, 5)}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('ro-RO', { 
                      style: 'currency', 
                      currency: 'RON',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                      notation: 'compact',
                      compactDisplay: 'short'
                    }).format(value)
                  } 
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    new Intl.NumberFormat('ro-RO', { 
                      style: 'currency', 
                      currency: 'RON'
                    }).format(value),
                    name === 'budget' ? 'Buget' : name === 'cost' ? 'Cost' : 'Venituri'
                  ]}
                />
                <Legend />
                <Bar dataKey="budget" name="Buget" fill="#8884d8" />
                <Bar dataKey="cost" name="Cost" fill="#ff8042" />
                <Bar dataKey="revenue" name="Venituri" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component pentru tab-ul de rapoarte clienți
function ClientReports({ data, isLoading, error }: { data: ReportsData | undefined; isLoading: boolean; error: Error | null }) {
  if (isLoading || error || !data) {
    return <ReportPlaceholder isLoading={isLoading} error={error} />;
  }
  
  const { client_revenue_data } = data;
  
  // Formatare sume financiare
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', { 
      style: 'currency', 
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Raport Clienți</h2>
      
      {/* Grafic venituri pe clienți */}
      <Card>
        <CardHeader>
          <CardTitle>Venituri pe Clienți</CardTitle>
          <CardDescription>
            Contribuția fiecărui client la veniturile companiei
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={client_revenue_data.sort((a, b) => b.revenue - a.revenue).slice(0, 8)}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('ro-RO', { 
                      style: 'currency', 
                      currency: 'RON',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                      notation: 'compact',
                      compactDisplay: 'short'
                    }).format(value)
                  } 
                />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip 
                  formatter={(value: number) => [
                    formatCurrency(value), 
                    "Venituri"
                  ]}
                />
                <Legend />
                <Bar dataKey="revenue" name="Venituri" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabel detaliat clienți */}
      <Card>
        <CardHeader>
          <CardTitle>Detalii Clienți</CardTitle>
          <CardDescription>
            Statistici detaliate despre clienții companiei
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Proiecte</TableHead>
                  <TableHead className="text-right">Facturi</TableHead>
                  <TableHead className="text-right">Venituri</TableHead>
                  <TableHead className="text-right">Venit Mediu/Proiect</TableHead>
                  <TableHead className="text-right">Variație</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client_revenue_data.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-right">{client.projects}</TableCell>
                    <TableCell className="text-right">{client.invoices}</TableCell>
                    <TableCell className="text-right">{formatCurrency(client.revenue)}</TableCell>
                    <TableCell className="text-right">
                      {client.projects > 0 
                        ? formatCurrency(client.revenue / client.projects) 
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        {client.percentChange > 0 ? (
                          <>
                            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                            <span className="text-green-500">+{client.percentChange}%</span>
                          </>
                        ) : client.percentChange < 0 ? (
                          <>
                            <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                            <span className="text-red-500">{client.percentChange}%</span>
                          </>
                        ) : (
                          <span>0%</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Distribuția clienților pe venituri */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuția Veniturilor pe Clienți</CardTitle>
          <CardDescription>
            Segmentarea clienților după contribuția la venituri
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-[300px] w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={client_revenue_data.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {client_revenue_data.slice(0, 6).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    formatCurrency(value), 
                    "Venituri"
                  ]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component principal pentru pagina de rapoarte
export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  
  // Obține datele pentru rapoarte
  const { data, isLoading, error } = useQuery<ReportsData>({
    queryKey: ['/api/reports', { 
      from: dateRange.from.toISOString(), 
      to: dateRange.to.toISOString() 
    }],
    queryFn: async () => {
      const response = await fetch(`/api/reports?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca datele pentru rapoarte');
      }
      
      return await response.json();
    }
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Rapoarte</h1>
          
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={{
                from: dateRange.from,
                to: dateRange.to
              }}
              onChange={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({
                    from: range.from,
                    to: range.to
                  });
                }
              }}
            />
          </div>
        </div>
        
        <Tabs defaultValue="financial" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="financial">
              <DollarSign className="h-4 w-4 mr-2" />
              Financiar
            </TabsTrigger>
            <TabsTrigger value="productivity">
              <BarChart3 className="h-4 w-4 mr-2" />
              Productivitate
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Building2 className="h-4 w-4 mr-2" />
              Clienți
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial">
            <FinancialReports data={data} isLoading={isLoading} error={error instanceof Error ? error : null} />
          </TabsContent>
          
          <TabsContent value="productivity">
            <ProductivityReports data={data} isLoading={isLoading} error={error instanceof Error ? error : null} />
          </TabsContent>
          
          <TabsContent value="clients">
            <ClientReports data={data} isLoading={isLoading} error={error instanceof Error ? error : null} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}