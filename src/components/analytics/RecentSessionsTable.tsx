import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap } from 'lucide-react';
import { MetaPixelHealthMetrics } from '@/hooks/useMetaPixelHealth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RecentSessionsTableProps {
  data: MetaPixelHealthMetrics | null;
  loading?: boolean;
}

const RecentSessionsTable = ({ data, loading }: RecentSessionsTableProps) => {
  if (loading || !data || !data.recent_sessions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Últimas 20 Sesiones (Tiempo Real)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-semibold">Session ID</th>
                <th className="text-left p-3 text-sm font-semibold">Eventos</th>
                <th className="text-left p-3 text-sm font-semibold">Valor Total</th>
                <th className="text-left p-3 text-sm font-semibold">Eventos Disparados</th>
                <th className="text-left p-3 text-sm font-semibold">Última Actividad</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_sessions.map((session, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {session.session_id.slice(-12)}
                    </code>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={session.events_count >= 3 ? 'default' : 'secondary'}>
                        {session.events_count} eventos
                      </Badge>
                      {session.events_count >= 3 && (
                        <Zap className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-sm">€{session.total_value}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {session.events_fired.map((event, eventIdx) => (
                        <Badge key={eventIdx} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-foreground/80">
                    {formatDistanceToNow(new Date(session.last_event), {
                      addSuffix: true,
                      locale: es
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-foreground/80 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Actualiza automáticamente con auto-refresh activado (60s)
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentSessionsTable;
