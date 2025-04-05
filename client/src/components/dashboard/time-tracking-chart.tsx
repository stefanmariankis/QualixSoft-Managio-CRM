import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export interface TimeTrackingData {
  date: string;
  hours: number;
  billable: number;
  nonBillable: number;
}

interface TimeTrackingChartProps {
  data: TimeTrackingData[];
  isLoading?: boolean;
}

export function TimeTrackingChart({ data, isLoading = false }: TimeTrackingChartProps) {
  // Show loading state if data is loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="animate-pulse bg-muted w-36 h-6 rounded"></CardTitle>
          <CardDescription className="animate-pulse bg-muted w-64 h-4 rounded"></CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] animate-pulse bg-muted rounded"></CardContent>
      </Card>
    );
  }

  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timp înregistrat</CardTitle>
          <CardDescription>Ore de lucru înregistrate zilnic în ultima săptămână</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            Nu există date disponibile pentru afișare.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate some statistics
  const totalHours = data.reduce((sum, item) => sum + item.hours, 0);
  const totalBillable = data.reduce((sum, item) => sum + item.billable, 0);
  const billablePercentage = totalHours ? Math.round((totalBillable / totalHours) * 100) : 0;

  // Custom tooltip formatter for recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <p className="text-sm text-muted-foreground">
              Total: {payload[0].value} ore
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <p className="text-sm text-muted-foreground">
              Facturabile: {payload[1].value} ore
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <p className="text-sm text-muted-foreground">
              Nefacturabile: {payload[2].value} ore
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timp înregistrat</CardTitle>
        <CardDescription>
          Ore de lucru înregistrate zilnic în ultima săptămână
          <div className="mt-2 flex items-center gap-2 text-xs font-medium">
            <span>Total: {totalHours} ore</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-green-500">Facturabile: {totalBillable} ore ({billablePercentage}%)</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBillable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNonBillable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="hours" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorHours)" 
              strokeWidth={2} 
            />
            <Area 
              type="monotone" 
              dataKey="billable" 
              stroke="#22c55e" 
              fillOpacity={1}
              fill="url(#colorBillable)" 
              strokeWidth={2} 
            />
            <Area 
              type="monotone" 
              dataKey="nonBillable" 
              stroke="#eab308" 
              fillOpacity={1}
              fill="url(#colorNonBillable)" 
              strokeWidth={2} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}