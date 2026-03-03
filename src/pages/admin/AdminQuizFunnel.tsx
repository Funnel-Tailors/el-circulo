import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import VSLPerformanceCards from "@/components/analytics/VSLPerformanceCards";
import VSLFunnelChart from "@/components/analytics/VSLFunnelChart";
import SessionFunnelChart from "@/components/analytics/SessionFunnelChart";
import QuestionMetrics from "@/components/analytics/QuestionMetrics";
import AnswerDistribution from "@/components/analytics/AnswerDistribution";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useQuestionMetrics } from "@/hooks/useQuestionMetrics";
import { useAnswerDistribution } from "@/hooks/useAnswerDistribution";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminQuizFunnel() {
  const [dateRange, setDateRange] = useState("30");
  const [quizVersion, setQuizVersion] = useState<"all" | "v1" | "v2" | "short">("all");

  const { overviewData, loading, fetchOverview } = useAnalyticsData();

  const { data: questionMetricsData, loading: questionMetricsLoading } = useQuestionMetrics({
    intervalDays: parseFloat(dateRange),
    quizVersion,
  });

  const { data: answerDistributionData, loading: answerDistLoading } = useAnswerDistribution({
    intervalDays: parseFloat(dateRange),
    quizVersion,
  });

  useEffect(() => {
    fetchOverview({
      intervalDays: parseFloat(dateRange),
      quizVersion,
    });
  }, [dateRange, quizVersion]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quiz Funnel</h1>
        <p className="text-muted-foreground">VSL, embudo de conversión y métricas por pregunta</p>
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
              <SelectItem value="7">Últimos 7 días</SelectItem>
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
      </div>

      <Tabs defaultValue="vsl" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vsl">VSL Performance</TabsTrigger>
          <TabsTrigger value="funnel">Embudo</TabsTrigger>
          <TabsTrigger value="preguntas">Por Pregunta</TabsTrigger>
        </TabsList>

        <TabsContent value="vsl" className="space-y-6">
          <VSLPerformanceCards data={overviewData.current?.vslKpis} />
          <VSLFunnelChart data={overviewData.current?.vslKpis} />
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <SessionFunnelChart data={overviewData.current?.sessionFunnel} loading={loading} />
        </TabsContent>

        <TabsContent value="preguntas" className="space-y-6">
          <QuestionMetrics data={questionMetricsData} loading={questionMetricsLoading} />
          <AnswerDistribution data={answerDistributionData} loading={answerDistLoading} quizVersion={quizVersion} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
