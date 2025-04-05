import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export interface InvoiceChartData {
  name: string;
  paid: number;
  unpaid: number;
  overdue: number;
}

interface InvoicesChartProps {
  data: InvoiceChartData[];
  isLoading?: boolean;
}

export function InvoicesChart({ data, isLoading = false }: InvoicesChartProps) {
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
          <CardTitle>Starea facturilor</CardTitle>
          <CardDescription>Raport lunar al facturilor după status</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            Nu există date disponibile pentru afișare.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip formatter for recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm text-muted-foreground">
                {entry.name}: {new Intl.NumberFormat('ro-RO', { 
                  style: 'currency', 
                  currency: 'RON',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(entry.value)}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Starea facturilor</CardTitle>
        <CardDescription>Raport lunar al facturilor după status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value/1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="paid" stackId="a" name="Plătite" fill="#4ade80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unpaid" stackId="a" name="Neplătite" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="overdue" stackId="a" name="Întârziate" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}