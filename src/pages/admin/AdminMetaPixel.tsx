import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MetaEventsJourney from "@/components/analytics/MetaEventsJourney";
import MetaPixelHealthCard from "@/components/analytics/MetaPixelHealthCard";
import RecentSessionsTable from "@/components/analytics/RecentSessionsTable";
import EventDistributionChart from "@/components/analytics/EventDistributionChart";
import { useMetaEventsJourney } from "@/hooks/useMetaEventsJourney";
import { useMetaPixelHealth } from "@/hooks/useMetaPixelHealth";
import { useMetaPixelEvolution } from "@/hooks/useMetaPixelEvolution";

export default function AdminMetaPixel() {
  const [dateRange, setDateRange] = useState("30");
  const [quizVersion, setQuizVersion] = useState<"all" | "v1" | "v2">("all");

  const { data: metaEventsData, loading: metaLoading } = useMetaEventsJourney({
    intervalDays: parseFloat(dateRange),
    quizVersion,
  });

  const { data: metaHealthData, loading: metaHealthLoading } = useMetaPixelHealth({
    intervalDays: parseFloat(dateRange),
    quizVersion,
  });

  const { data: metaEvolutionData, loading: metaEvolutionLoading } = useMetaPixelEvolution({
    daysBack: 7,
    quizVersion,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meta Pixel</h1>
        <p className="text-muted-foreground">Events journey, health y sesiones recientes</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Label htmlFor="date-range">Período:</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
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
          <Select value={quizVersion} onValueChange={(v) => setQuizVersion(v as any)}>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        <MetaPixelHealthCard
          data={metaHealthData}
          evolutionData={metaEvolutionData}
          loading={metaHealthLoading || metaEvolutionLoading}
        />

        <MetaEventsJourney data={metaEventsData} loading={metaLoading} />

        <EventDistributionChart data={metaHealthData} loading={metaHealthLoading} />

        <RecentSessionsTable data={metaHealthData} loading={metaHealthLoading} />
      </div>
    </div>
  );
}
