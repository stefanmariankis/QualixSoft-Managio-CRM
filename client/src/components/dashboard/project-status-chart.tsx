import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

interface ProjectStatusChartProps {
  data: ProjectStatusData[];
  isLoading?: boolean;
}

export function ProjectStatusChart({ data, isLoading = false }: ProjectStatusChartProps) {
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
          <CardTitle>Statusul proiectelor</CardTitle>
          <CardDescription>Distribuția proiectelor după status</CardDescription>
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
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-muted-foreground">
            {payload[0].value} proiecte ({Math.round((payload[0].value / data.reduce((sum, item) => sum + item.value, 0)) * 100)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statusul proiectelor</CardTitle>
        <CardDescription>Distribuția proiectelor după status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}