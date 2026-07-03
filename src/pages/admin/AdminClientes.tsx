import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Target, TrendingUp, Megaphone } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import FunnelChart from '@/components/analytics/FunnelChart';
import UTMPerformance from '@/components/analytics/UTMPerformance';
import { useClientFunnelData, type ProjectStats } from '@/hooks/useClientFunnelData';

const RANGES = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
];

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ProjectDetail({ stats }: { stats: ProjectStats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Sesiones" value={stats.sessions} hint={`${stats.pageViews} páginas vistas`} icon={Users} />
        <KpiCard
          title="Leads"
          value={stats.leads}
          hint={stats.disqualified ? `${stats.disqualified} descalificados` : undefined}
          icon={Target}
        />
        <KpiCard title="Conversión" value={`${stats.conversionRate}%`} hint="sesión → lead" icon={TrendingUp} />
        <KpiCard
          title="Tráfico de pago"
          value={`${stats.paidShare}%`}
          hint={`top source: ${stats.topSource}`}
          icon={Megaphone}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FunnelChart data={stats.funnel} loading={false} />

        <Card>
          <CardHeader>
            <CardTitle>Sesiones vs Leads por día</CardTitle>
            <CardDescription>
              Mayor abandono en: <span className="font-medium">{stats.biggestDropStep}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.daily.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Sin datos en el rango</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Sesiones"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.25}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <UTMPerformance data={stats.utm} loading={false} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.deviceSplit.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {stats.deviceSplit.map((d) => (
                  <div key={d.device} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{d.device}</span>
                    <Badge variant="secondary">{d.sessions}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sesiones recientes</CardTitle>
            <CardDescription>Últimas {stats.recentSessions.length} sesiones del rango</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin sesiones en el rango</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead className="text-center">Pasos</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentSessions.map((s) => (
                    <TableRow key={s.session_id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(s.started_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{s.utm_source}</TableCell>
                      <TableCell className="capitalize">{s.device_type}</TableCell>
                      <TableCell className="text-center">{s.steps_completed}</TableCell>
                      <TableCell>
                        {s.lead ? (
                          <Badge>Lead</Badge>
                        ) : s.last_event === 'disqualified' ? (
                          <Badge variant="destructive">Descalificado</Badge>
                        ) : (
                          <Badge variant="secondary">{s.last_event === 'page_view' ? 'Visita' : 'Abandono'}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminClientes() {
  const [days, setDays] = useState(30);
  const { projects, byProject, loading, refetch } = useClientFunnelData(days);

  const totals = Object.values(byProject).reduce(
    (acc, p) => ({
      sessions: acc.sessions + p.sessions,
      leads: acc.leads + p.leads,
    }),
    { sessions: 0, leads: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Funnels de Clientes</h1>
          <p className="text-muted-foreground">
            Stats de conversión de las landings de clientes (memorable, vitini…)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              variant={days === r.days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">📊 Todos</TabsTrigger>
            {projects.map((p) => (
              <TabsTrigger key={p.slug} value={p.slug}>
                {p.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard title="Sesiones (todos)" value={totals.sessions} icon={Users} />
              <KpiCard title="Leads (todos)" value={totals.leads} icon={Target} />
              <KpiCard
                title="Conversión media"
                value={totals.sessions ? `${Math.round((totals.leads / totals.sessions) * 1000) / 10}%` : '—'}
                icon={TrendingUp}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Comparativa de clientes</CardTitle>
                <CardDescription>Últimos {days} días</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Sesiones</TableHead>
                      <TableHead className="text-right">Inician funnel</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Conversión</TableHead>
                      <TableHead className="text-right">% Pago</TableHead>
                      <TableHead>Top source</TableHead>
                      <TableHead>Mayor abandono</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((p) => {
                      const s = byProject[p.slug];
                      if (!s) return null;
                      return (
                        <TableRow key={p.slug}>
                          <TableCell className="font-medium">
                            {p.name}{' '}
                            {!p.active && (
                              <Badge variant="secondary" className="ml-1">
                                inactivo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{s.sessions}</TableCell>
                          <TableCell className="text-right">{s.funnelStarts}</TableCell>
                          <TableCell className="text-right font-medium">{s.leads}</TableCell>
                          <TableCell className="text-right">{s.conversionRate}%</TableCell>
                          <TableCell className="text-right">{s.paidShare}%</TableCell>
                          <TableCell>{s.topSource}</TableCell>
                          <TableCell>{s.biggestDropStep}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {projects.map((p) => (
            <TabsContent key={p.slug} value={p.slug}>
              {byProject[p.slug] && <ProjectDetail stats={byProject[p.slug]} />}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
