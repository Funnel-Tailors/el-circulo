import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Target, Network } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AIInsights {
  critical: string | null;
  topInsights: string[];
  actions: string[];
  correlations: string[];
}

interface AIInsightsCardProps {
  insights: AIInsights | null;
  loading: boolean;
  onGenerate: () => void;
  lastGenerated: Date | null;
  disabled?: boolean;
}

export default function AIInsightsCard({ 
  insights, 
  loading, 
  onGenerate, 
  lastGenerated,
  disabled = false 
}: AIInsightsCardProps) {
  
  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <CardTitle>Insights con IA</CardTitle>
            </div>
          </div>
          <CardDescription>Generando análisis inteligente...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>Insights con IA</CardTitle>
            </div>
            <Button 
              onClick={onGenerate} 
              disabled={disabled}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generar Análisis
            </Button>
          </div>
          <CardDescription>
            Obtén insights profundos y accionables generados por IA analizando todas tus métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Sparkles className="w-12 h-12 mb-4 text-primary/50" />
            <p className="text-sm max-w-md">
              Haz clic en "Generar Análisis" para obtener recomendaciones específicas sobre cómo mejorar 
              tu funnel, campañas de paid media y engagement del VSL.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Insights con IA</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {lastGenerated && (
              <span className="text-xs text-muted-foreground">
                Generado: {lastGenerated.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGenerate}
              disabled={disabled}
              className="gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerar
            </Button>
          </div>
        </div>
        <CardDescription>
          Análisis automático y recomendaciones basadas en todas tus métricas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Critical Alert */}
        {insights.critical && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <Badge variant="destructive" className="mb-2">ALERTA CRÍTICA</Badge>
                <p className="text-sm leading-relaxed">{insights.critical}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Insights Principales</h3>
          </div>
          <div className="space-y-3">
            {insights.topInsights.map((insight, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 flex-shrink-0">
                    {index + 1}
                  </Badge>
                  <p className="text-sm leading-relaxed">{insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Acciones Recomendadas</h3>
          </div>
          <div className="space-y-2">
            {insights.actions.map((action, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
              >
                <p className="text-sm leading-relaxed font-medium">{action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Correlations */}
        {insights.correlations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Correlaciones Detectadas</h3>
            </div>
            <div className="space-y-2">
              {insights.correlations.map((correlation, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <p className="text-sm leading-relaxed text-muted-foreground">{correlation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
