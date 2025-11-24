import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Zap, AlertCircle, TrendingDown, PauseCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { MetaPixelHealthMetrics, UTMPerformanceMetrics } from '@/hooks/useMetaPixelHealth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { motion } from 'framer-motion';

interface EvolutionDataPoint {
  date: string;
  coverage_percentage: number;
  avg_events_per_session: number;
  total_sessions: number;
  sessions_with_events: number;
}

interface MetaPixelHealthCardProps {
  data: MetaPixelHealthMetrics | null;
  evolutionData: EvolutionDataPoint[] | null;
  loading?: boolean;
}

const MetaPixelHealthCard = ({ data, evolutionData, loading }: MetaPixelHealthCardProps) => {
  if (loading || !data) {
    return (
      <div className="glass-card-dark p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const getHealthStatus = (coverage: number) => {
    if (coverage >= 80) return { label: 'Excelente', color: 'bg-emerald-500', variant: 'default' as const };
    if (coverage >= 50) return { label: 'Bueno', color: 'bg-amber-500', variant: 'secondary' as const };
    return { label: 'Mejorable', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const healthStatus = getHealthStatus(data.coverage_percentage);

  // Calculate comparison vs previous period if we have evolution data
  let coverageChangePercent = 0;
  let eventsChangePercent = 0;
  
  if (evolutionData && evolutionData.length >= 6) {
    const recentPeriod = evolutionData.slice(-3);
    const previousPeriod = evolutionData.slice(0, 3);
    
    const recentCoverage = recentPeriod.reduce((sum, d) => sum + d.coverage_percentage, 0) / 3;
    const previousCoverage = previousPeriod.reduce((sum, d) => sum + d.coverage_percentage, 0) / 3;
    coverageChangePercent = previousCoverage > 0 ? ((recentCoverage - previousCoverage) / previousCoverage) * 100 : 0;
    
    const recentEvents = recentPeriod.reduce((sum, d) => sum + d.avg_events_per_session, 0) / 3;
    const previousEvents = previousPeriod.reduce((sum, d) => sum + d.avg_events_per_session, 0) / 3;
    eventsChangePercent = previousEvents > 0 ? ((recentEvents - previousEvents) / previousEvents) * 100 : 0;
  }

  // Format evolution data for chart
  const chartData = evolutionData?.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  })) || [];

  return (
    <div className="glass-card-dark p-6 space-y-6 relative overflow-hidden">
      {/* Header con Badge LIVE pulsante */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-bold flex items-center gap-3">
          <Activity className="h-5 w-5 text-foreground/80" />
          <span className="glow">Salud del Tracking Meta Pixel</span>
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Badge LIVE pulsante */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live</span>
          </div>
          
          {/* Badge de salud */}
          <Badge 
            className={`${
              healthStatus.label === 'Excelente' 
                ? 'bg-emerald-600 text-white' 
                : healthStatus.label === 'Bueno' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-red-600 text-white'
            }`}
          >
            {healthStatus.label}
          </Badge>
        </div>
      </div>
      {/* KPI Cards con glass-card-dark */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card-dark p-4 group hover:scale-105 transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${healthStatus.color}`} />
            <p className="text-sm text-foreground/80">Coverage Rate</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{data.coverage_percentage}%</p>
            {coverageChangePercent !== 0 && (
              <div className={`flex items-center text-sm font-semibold ${
                coverageChangePercent > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {coverageChangePercent > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(coverageChangePercent).toFixed(0)}%</span>
              </div>
            )}
          </div>
          <p className="text-xs text-foreground/70 mt-1">
            {data.total_sessions_with_meta_events} de {data.total_sessions_quiz_analytics} sesiones
          </p>
        </div>

        <div className="glass-card-dark p-4 group hover:scale-105 transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-foreground/80">Eventos/Sesión</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{data.avg_events_per_session}</p>
            {eventsChangePercent !== 0 && (
              <div className={`flex items-center text-sm font-semibold ${
                eventsChangePercent > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {eventsChangePercent > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(eventsChangePercent).toFixed(0)}%</span>
              </div>
            )}
          </div>
          <p className="text-xs text-foreground/70 mt-1">
            Máx: {data.max_events_in_session} eventos
          </p>
        </div>

        <div className="glass-card-dark p-4 group hover:scale-105 transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-foreground/80">Mejora vs Antes</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            +{Math.round((data.avg_events_per_session / 0.2 - 1) * 100)}%
          </p>
          <p className="text-xs text-foreground/70 mt-1">
            Vs 0.2 eventos/sesión anterior
          </p>
        </div>
      </div>

      {/* Gráfico Animado con Áreas de Gradiente */}
      {chartData.length > 0 && (
        <div className="glass-card-dark p-5">
          {/* Header con separadores ⟡ */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="text-foreground/40">⟡</span>
              Evolución Últimos 7 Días
              <span className="text-foreground/40">⟡</span>
            </p>
            
            {/* Leyenda inline */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-primary" />
                <span className="text-foreground/70">Coverage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-amber-500" />
                <span className="text-foreground/70">Eventos/Ses</span>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <defs>
                {/* Gradientes para áreas bajo las curvas */}
                <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(45 100% 51%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(45 100% 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground) / 0.1)" />
              
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--foreground) / 0.7)', fontSize: 11 }}
                stroke="hsl(var(--foreground) / 0.3)"
              />
              
              <YAxis 
                yAxisId="left"
                tick={{ fill: 'hsl(var(--foreground) / 0.7)', fontSize: 11 }}
                stroke="hsl(var(--foreground) / 0.3)"
                label={{ 
                  value: 'Coverage %', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--foreground) / 0.7)', fontSize: '11px' }
                }}
              />
              
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'hsl(var(--foreground) / 0.7)', fontSize: 11 }}
                stroke="hsl(var(--foreground) / 0.3)"
                label={{ 
                  value: 'Eventos/Ses', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { fill: 'hsl(var(--foreground) / 0.7)', fontSize: '11px' }
                }}
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.85)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                  padding: '10px 14px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'coverage_percentage') return [`${value.toFixed(1)}%`, 'Coverage'];
                  if (name === 'avg_events_per_session') return [value.toFixed(2), 'Eventos'];
                  return value;
                }}
              />
              
              {/* Área bajo Coverage */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="coverage_percentage"
                fill="url(#coverageGradient)"
                stroke="transparent"
              />
              
              {/* Línea Coverage con animación */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="coverage_percentage" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2.5}
                dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 6, strokeWidth: 3 }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
              
              {/* Área bajo Eventos */}
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="avg_events_per_session"
                fill="url(#eventsGradient)"
                stroke="transparent"
              />
              
              {/* Línea Eventos con animación */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avg_events_per_session" 
                stroke="hsl(45 100% 51%)"
                strokeWidth={2.5}
                dot={{ fill: 'hsl(45 100% 51%)', r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 6, strokeWidth: 3 }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Insight automático con separadores ✦ */}
          <div className="mt-4 pt-3 border-t border-foreground/10">
            <div className="text-xs text-foreground/80">
              {coverageChangePercent > 5 ? (
                <p className="flex items-center gap-2">
                  <span className="text-foreground/40">✦</span>
                  Coverage mejorando <span className="font-semibold text-emerald-600">+{coverageChangePercent.toFixed(1)}%</span> vs periodo anterior
                  <span className="text-foreground/40">✦</span>
                </p>
              ) : coverageChangePercent < -5 ? (
                <p className="flex items-center gap-2">
                  <span className="text-foreground/40">✦</span>
                  ⚠️ Coverage descendiendo <span className="font-semibold text-red-600">{coverageChangePercent.toFixed(1)}%</span> - revisar tracking
                  <span className="text-foreground/40">✦</span>
                </p>
              ) : (
                <p className="flex items-center gap-2">
                  <span className="text-foreground/40">✦</span>
                  Coverage estable. Con {data.coverage_percentage}% actual, aún hay margen hacia el objetivo del 80%
                  <span className="text-foreground/40">✦</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Health Indicators */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground/90">Indicadores de Salud:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <HealthIndicator
            status={data.coverage_percentage >= 80 ? 'success' : data.coverage_percentage >= 50 ? 'warning' : 'error'}
            label="Coverage Rate"
            value={`${data.coverage_percentage}% de sesiones tracked`}
            target={<>{'>'}80% para tracking óptimo</>}
          />
          <HealthIndicator
            status={data.avg_events_per_session >= 2 ? 'success' : data.avg_events_per_session >= 1 ? 'warning' : 'error'}
            label="Event Density"
            value={`${data.avg_events_per_session} eventos/sesión`}
            target={<>{'>'}2 eventos/sesión para learning phase</>}
          />
        </div>
      </div>

      {/* UTM Performance Table con Sistema de Alertas Estratégico */}
      {data.utm_performance && data.utm_performance.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card-dark p-5 space-y-4"
        >
          {/* Header con separadores */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="text-foreground/40">⟡</span>
              <span className="glow">Performance por Campaign (Lifetime)</span>
              <span className="text-foreground/40">⟡</span>
            </p>
            
            {/* Leyenda de estados */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-foreground/70">Pausar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-foreground/70">Warning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-foreground/70">Healthy</span>
              </div>
            </div>
          </div>

          {/* Tabla compacta */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-foreground/20">
                  <th className="text-left py-2 px-2 text-foreground/70 font-semibold">Status</th>
                  <th className="text-left py-2 px-2 text-foreground/70 font-semibold">Campaign ID</th>
                  <th className="text-right py-2 px-2 text-foreground/70 font-semibold">Age</th>
                  <th className="text-right py-2 px-2 text-foreground/70 font-semibold">Sesiones</th>
                  <th className="text-right py-2 px-2 text-foreground/70 font-semibold">Eventos/Ses</th>
                  <th className="text-right py-2 px-2 text-foreground/70 font-semibold">Bounce%</th>
                  <th className="text-right py-2 px-2 text-foreground/70 font-semibold">AddToCart</th>
                  <th className="text-right py-2 px-2 text-foreground/70 font-semibold">Leads</th>
                  <th className="text-right py-2 px-2 text-foreground/70 font-semibold">ATC Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.utm_performance.map((utm, idx) => {
                  const status = getUTMStrategicStatus(utm);
                  return (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className={`border-b border-foreground/10 hover:bg-foreground/5 transition-colors ${
                        status.bgClass
                      }`}
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <motion.div 
                            className={`w-2 h-2 rounded-full ${status.dotColor}`}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <Badge 
                            className={`text-[10px] px-1.5 py-0.5 ${status.badgeClass} flex items-center gap-1`}
                          >
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex flex-col">
                          <span className="font-mono text-foreground font-semibold">
                            {formatCampaignId(utm.utm_campaign)}
                          </span>
                          <span className="text-foreground/50 text-[10px]">
                            {utm.utm_source} / {utm.utm_medium}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="text-foreground/80">{utm.age_days}d</span>
                      </td>
                      <td className="py-2 px-2 text-right font-semibold">
                        {utm.total_sessions_lifetime}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={
                          utm.avg_events_per_session_lifetime > 2 ? 'text-emerald-400 font-semibold' :
                          utm.avg_events_per_session_lifetime > 1.5 ? 'text-amber-400' :
                          'text-red-400 font-semibold'
                        }>
                          {utm.avg_events_per_session_lifetime}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={
                          utm.bounce_rate_lifetime > 90 ? 'text-red-400 font-semibold' :
                          utm.bounce_rate_lifetime > 75 ? 'text-amber-400' :
                          'text-emerald-400'
                        }>
                          {utm.bounce_rate_lifetime}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-primary">
                        {utm.addtocart_events_lifetime}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-emerald-400">
                        {utm.lead_events_lifetime}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={
                          utm.addtocart_rate_lifetime > 3 ? 'text-emerald-400 font-semibold' :
                          utm.addtocart_rate_lifetime > 1 ? 'text-amber-400' :
                          'text-foreground/70'
                        }>
                          {utm.addtocart_rate_lifetime}%
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Strategic Insight automático con separadores */}
          <div className="pt-3 border-t border-foreground/10">
            <div className="text-xs text-foreground/80">
              {(() => {
                const pausarImmediate = data.utm_performance.filter(utm => 
                  utm.strategic_status === 'PAUSAR_IMMEDIATE'
                );
                const pausarPostLearning = data.utm_performance.filter(utm => 
                  utm.strategic_status === 'PAUSAR_POST_LEARNING'
                );
                const pausarLongTerm = data.utm_performance.filter(utm => 
                  utm.strategic_status === 'PAUSAR_LONG_TERM'
                );
                const allPausar = [...pausarImmediate, ...pausarPostLearning, ...pausarLongTerm];
                
                const warnings = data.utm_performance.filter(utm => 
                  utm.strategic_status.startsWith('WARNING')
                );
                
                const healthy = data.utm_performance.filter(utm => 
                  utm.strategic_status === 'HEALTHY'
                );
                
                const totalPausarSessions = allPausar.reduce((sum, utm) => sum + utm.total_sessions_lifetime, 0);
                
                if (pausarImmediate.length > 0) {
                  return (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-foreground/40">✦</span>
                      🚨 <span className="font-semibold text-red-400">{pausarImmediate.length} campaign(s)</span> marcadas como PAUSAR INMEDIATO - bounce crítico {'>'} 95%, 0 conversiones. 
                      <span className="font-semibold text-red-300">Acción: pausar HOY</span>
                      <span className="text-foreground/40">✦</span>
                    </motion.p>
                  );
                } else if (allPausar.length > 0) {
                  const avgAge = (allPausar.reduce((sum, utm) => sum + utm.age_days, 0) / allPausar.length).toFixed(1);
                  return (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-foreground/40">✦</span>
                      🚨 <span className="font-semibold text-red-400">{allPausar.length} campaign(s)</span> marcadas como PAUSAR - 
                      llevan {avgAge} días promedio, acumulan {totalPausarSessions} sesiones lifetime, rendimiento deficiente. 
                      <span className="font-semibold text-red-300">Acción recomendada: pausar y concentrar presupuesto en winners</span>
                      <span className="text-foreground/40">✦</span>
                    </motion.p>
                  );
                } else if (healthy.length === data.utm_performance.length) {
                  return (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-foreground/40">✦</span>
                      ✅ Todas las campaigns están <span className="font-semibold text-emerald-400">Healthy</span> - tráfico de calidad certificado. 
                      <span className="font-semibold text-emerald-300">Acción: mantener y considerar escalar presupuesto</span>
                      <span className="text-foreground/40">✦</span>
                    </motion.p>
                  );
                } else if (warnings.length > 0) {
                  return (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-foreground/40">✦</span>
                      ⚠️ <span className="font-semibold text-amber-400">{warnings.length} campaign(s)</span> en Warning - 
                      monitorear de cerca próximas 24-48h. Si no mejoran, considerar pausar
                      <span className="text-foreground/40">✦</span>
                    </motion.p>
                  );
                } else {
                  return (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-foreground/40">✦</span>
                      ⏳ Campaigns demasiado early para evaluación estratégica - acumular más data (mínimo 2d + 30 sesiones)
                      <span className="text-foreground/40">✦</span>
                    </motion.p>
                  );
                }
              })()}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Helper: Determinar status estratégico de UTM
const getUTMStrategicStatus = (utm: UTMPerformanceMetrics): {
  label: string;
  dotColor: string;
  badgeClass: string;
  bgClass: string;
  icon: React.ReactNode;
} => {
  const statusMap = {
    'PAUSAR_IMMEDIATE': {
      label: 'PAUSAR',
      dotColor: 'bg-red-500',
      badgeClass: 'bg-red-600 text-white border-red-500/50',
      bgClass: 'bg-red-950/20',
      icon: <PauseCircle className="h-3 w-3" />
    },
    'PAUSAR_POST_LEARNING': {
      label: 'PAUSAR',
      dotColor: 'bg-red-500',
      badgeClass: 'bg-red-600 text-white border-red-500/50',
      bgClass: 'bg-red-950/20',
      icon: <PauseCircle className="h-3 w-3" />
    },
    'PAUSAR_LONG_TERM': {
      label: 'PAUSAR',
      dotColor: 'bg-red-500',
      badgeClass: 'bg-red-600 text-white border-red-500/50',
      bgClass: 'bg-red-950/20',
      icon: <PauseCircle className="h-3 w-3" />
    },
    'WARNING_EARLY': {
      label: 'WARNING',
      dotColor: 'bg-amber-500',
      badgeClass: 'bg-amber-600 text-white border-amber-500/50',
      bgClass: 'bg-amber-950/10',
      icon: <AlertTriangle className="h-3 w-3" />
    },
    'WARNING_MEDIOCRE': {
      label: 'WARNING',
      dotColor: 'bg-amber-500',
      badgeClass: 'bg-amber-600 text-white border-amber-500/50',
      bgClass: 'bg-amber-950/10',
      icon: <AlertTriangle className="h-3 w-3" />
    },
    'TOO_EARLY': {
      label: 'TOO EARLY',
      dotColor: 'bg-blue-500',
      badgeClass: 'bg-blue-600 text-white border-blue-500/50',
      bgClass: '',
      icon: <Clock className="h-3 w-3" />
    },
    'HEALTHY': {
      label: 'HEALTHY',
      dotColor: 'bg-emerald-500',
      badgeClass: 'bg-emerald-600 text-white border-emerald-500/50',
      bgClass: '',
      icon: <CheckCircle className="h-3 w-3" />
    }
  };

  return statusMap[utm.strategic_status] || statusMap['TOO_EARLY'];
};

// Helper: Formatear campaign ID para display
const formatCampaignId = (campaign: string): string => {
  if (campaign === 'none' || !campaign) return 'Sin Campaign';
  // Acortar IDs largos: 23851481808050791 → ...1808050791
  if (campaign.length > 15) {
    return '...' + campaign.slice(-10);
  }
  return campaign;
};

interface HealthIndicatorProps {
  status: 'success' | 'warning' | 'error';
  label: string;
  value: string;
  target: React.ReactNode;
}

const HealthIndicator = ({ status, label, value, target }: HealthIndicatorProps) => {
  const icons = {
    success: <TrendingUp className="h-4 w-4 text-emerald-400" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />
  };

  const backgrounds = {
    success: 'bg-emerald-950/40 border-emerald-600/40 shadow-lg shadow-emerald-900/20',
    warning: 'bg-amber-950/40 border-amber-600/40 shadow-lg shadow-amber-900/20',
    error: 'bg-red-950/40 border-red-600/40 shadow-lg shadow-red-900/20'
  };

  return (
    <div className={`p-3 rounded-lg border transition-all duration-300 hover:scale-105 ${backgrounds[status]}`}>
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-full bg-background/40">
          {icons[status]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-foreground/80">{value}</p>
          <p className="text-xs text-foreground/60 mt-1">Target: {target}</p>
        </div>
      </div>
    </div>
  );
};

export default MetaPixelHealthCard;
