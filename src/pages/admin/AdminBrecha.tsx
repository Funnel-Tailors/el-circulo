import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AdminBrecha() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">La Brecha</h1>
        <p className="text-muted-foreground">Journey metrics y gestión de leads (Fase 2)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            En desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            El sistema de tracking y gestión de leads para La Brecha se implementará en la Fase 2.
            Incluirá:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>BrechaLeadsManager - Gestión de leads con tier/cualificación</li>
            <li>BrechaJourneyMetrics - Métricas por fragmento</li>
            <li>Tracking de drops capturados vs perdidos</li>
            <li>Estado de rituales y portales</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
