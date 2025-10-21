import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface UTMPerformanceProps {
  data: Array<{
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    sessions: number;
    conversions: number;
    conversion_rate: number;
  }>;
  loading: boolean;
}

const UTMPerformance = ({ data, loading }: UTMPerformanceProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por UTM</CardTitle>
          <CardDescription>
            No hay datos de campañas. Añade parámetros UTM a tus URLs:
            <code className="block mt-2 p-2 bg-muted rounded text-sm">
              ?utm_source=facebook&utm_medium=cpc&utm_campaign=quiz_launch
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Sin datos de UTM</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por UTM</CardTitle>
        <CardDescription>Analiza el rendimiento de tus campañas de marketing</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Medium</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Sesiones</TableHead>
              <TableHead className="text-right">Conversiones</TableHead>
              <TableHead className="text-right">Tasa Conv.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.utm_source || '-'}</TableCell>
                <TableCell>{item.utm_medium || '-'}</TableCell>
                <TableCell>{item.utm_campaign || '-'}</TableCell>
                <TableCell className="text-right">{item.sessions}</TableCell>
                <TableCell className="text-right">{item.conversions}</TableCell>
                <TableCell className="text-right font-semibold">{item.conversion_rate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UTMPerformance;
