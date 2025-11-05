import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { calculatePercentChange, formatValue } from '@/lib/analytics-comparison';

interface ComparisonCardProps {
  title: string;
  currentValue: number | string;
  previousValue: number | string;
  trend: number[];
  format?: 'number' | 'percentage' | 'currency' | 'time';
  inverse?: boolean;
}

const ComparisonCard = ({
  title,
  currentValue,
  previousValue,
  trend,
  format = 'number',
  inverse = false
}: ComparisonCardProps) => {
  const currentNum = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue);
  const previousNum = typeof previousValue === 'number' ? previousValue : parseFloat(previousValue);
  
  const percentChange = calculatePercentChange(currentNum, previousNum);
  const isPositive = inverse ? percentChange < 0 : percentChange > 0;
  const trendColor = isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 72%, 51%)';
  
  const chartData = trend.map((value, index) => ({ index, value }));

  return (
    <Card className="relative overflow-hidden dark-card border-border/50 hover:border-border transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-4xl font-bold text-foreground">
          {formatValue(currentNum, format)}
        </div>
        
        <div className={`flex items-center gap-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          <span className="font-semibold">{Math.abs(percentChange).toFixed(1)}%</span>
          <span className="text-muted-foreground">vs período anterior</span>
        </div>
        
        {trend.length > 0 && (
          <div className="h-12 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={trendColor} 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: isPositive 
            ? 'linear-gradient(to bottom right, hsl(142, 76%, 36%), transparent)' 
            : 'linear-gradient(to bottom right, hsl(0, 72%, 51%), transparent)'
        }}
      />
    </Card>
  );
};

export default ComparisonCard;
