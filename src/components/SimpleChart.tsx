// Simple chart component to replace the complex chart for now
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartData[];
  title?: string;
  type?: 'bar' | 'line' | 'pie';
}

export function SimpleChart({ data, title, type = 'bar' }: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.value}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500 bg-primary"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || 'hsl(var(--primary))'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}