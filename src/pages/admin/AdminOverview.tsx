import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ComparisonSummaryCards from "@/components/analytics/ComparisonSummaryCards";
import SessionFunnelChart from "@/components/analytics/SessionFunnelChart";
import StatsCards from "@/components/analytics/StatsCards";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";

export default function AdminOverview() {
  const [dateRange, setDateRange] = useState("30");
  const [quizVersion, setQuizVersion] = useState<"all" | "v1" | "v2" | "short">("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { overviewData, loading, lastUpdate, fetchOverview } = useAnalyticsData();

  useEffect(() => {
    setError(null);
    fetchOverview({
      intervalDays: parseFloat(dateRange),
      quizVersion,
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Error desconocido");
    });
  }, [dateRange, quizVersion]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(async () => {
        try {
          await fetchOverview({
            intervalDays: parseFloat(dateRange),
            quizVersion,
          });
        } catch (error) {
          console.error("Error auto-refreshing:", error);
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, dateRange, quizVersion, fetchOverview]);

  const handleRefresh = async () => {
    setError(null);
    try {
      await fetchOverview({
        intervalDays: parseFloat(dateRange),
        quizVersion,
      });
      toast({
        title: "Datos actualizados",
        description: "Analytics recargados exitosamente",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resumen General</h1>
          <p className="text-muted-foreground">
            Última actualización: {lastUpdate.toLocaleTimeString("es-ES")}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Label htmlFor="date-range">Período:</Label>
          <Select value={dateRange} onValueChange={setDateRange} disabled={loading}>
            <SelectTrigger id="date-range" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.333">Últimas 8 horas</SelectItem>
              <SelectItem value="1">Últimas 24 horas</SelectItem>
              <SelectItem value="3">Últimos 3 días</SelectItem>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="14">Últimas 2 semanas</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="quiz-version">Versión:</Label>
          <Select value={quizVersion} onValueChange={(v) => setQuizVersion(v as any)} disabled={loading}>
            <SelectTrigger id="quiz-version" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="v1">
                <div className="flex items-center gap-2">
                  Quiz v1
                  <Badge variant="secondary" className="text-xs">Legacy</Badge>
                </div>
              </SelectItem>
              <SelectItem value="v2">
                <div className="flex items-center gap-2">
                  Quiz v2
                  <Badge variant="default" className="text-xs">Actual</Badge>
                </div>
              </SelectItem>
              <SelectItem value="short">
                <div className="flex items-center gap-2">
                  Quiz Short
                  <Badge variant="outline" className="text-xs">A/B</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} disabled={loading} />
          <Label htmlFor="auto-refresh">Auto-actualizar (60s)</Label>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Error al cargar datos:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && !overviewData.current ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-foreground/80">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ComparisonSummaryCards
            currentData={{
              kpis: overviewData.current?.quizKpis,
              sessionFunnel: overviewData.current?.sessionFunnel,
              vslKpis: overviewData.current?.vslKpis,
            }}
            previousData={{
              kpis: overviewData.previous?.quizKpis,
              sessionFunnel: overviewData.previous?.sessionFunnel,
              vslKpis: overviewData.previous?.vslKpis,
            }}
            trends={overviewData.current?.dailyTrends || []}
            dateRange={parseFloat(dateRange)}
          />

          <SessionFunnelChart data={overviewData.current?.sessionFunnel} loading={loading} />

          <StatsCards
            kpis={overviewData.current?.quizKpis}
            sessionFunnel={overviewData.current?.sessionFunnel}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
