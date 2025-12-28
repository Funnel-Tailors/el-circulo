import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrechaJourneyMetrics from "@/components/brecha/BrechaJourneyMetrics";
import BrechaLeadsManager from "@/components/brecha/BrechaLeadsManager";

export default function AdminBrecha() {
  const [dateRange, setDateRange] = useState("30");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">La Brecha</h1>
        <p className="text-muted-foreground">Journey metrics y gestión de leads</p>
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
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="journey" className="space-y-6">
        <TabsList>
          <TabsTrigger value="journey">Journey Metrics</TabsTrigger>
          <TabsTrigger value="leads">Gestión Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="journey" className="space-y-6">
          <BrechaJourneyMetrics intervalDays={parseFloat(dateRange)} />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <BrechaLeadsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
