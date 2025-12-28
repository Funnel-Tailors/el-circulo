import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useBrechaLeads, BrechaLeadWithProgress } from "@/hooks/useBrechaLeads";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const getTierBadge = (tier: string | null, isQualified: boolean | null) => {
  if (tier === "premium") return <Badge className="bg-amber-500">Premium</Badge>;
  if (tier === "full_access") return <Badge className="bg-green-500">Full Access</Badge>;
  if (tier === "offer_only") return <Badge variant="secondary">Solo Oferta</Badge>;
  if (isQualified === false) return <Badge variant="destructive">Descualificado</Badge>;
  return <Badge variant="outline">Pendiente</Badge>;
};

const getFragmentLabel = (fragment: number) => {
  if (fragment === 0) return "Sin iniciar";
  if (fragment === 5) return "✅ Completado";
  return `Fragmento ${fragment}`;
};

const LeadRow = ({ lead, isExpanded, onToggle }: { lead: BrechaLeadWithProgress; isExpanded: boolean; onToggle: () => void }) => (
  <>
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
      <TableCell>
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="font-medium">{lead.first_name || "Sin nombre"}</span>
        </div>
      </TableCell>
      <TableCell>{getTierBadge(lead.tier, lead.is_qualified)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-sm">{getFragmentLabel(lead.currentFragment)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={lead.completionPercentage} className="h-2 w-20" />
          <span className="text-sm text-muted-foreground">{lead.completionPercentage}%</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(lead.created_at), "dd MMM yyyy HH:mm", { locale: es })}
      </TableCell>
    </TableRow>
    {isExpanded && (
      <TableRow>
        <TableCell colSpan={5} className="bg-muted/30 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Facturación</p>
              <p className="font-medium">{lead.revenue_answer || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Dolor</p>
              <p className="font-medium">{lead.pain_answer || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Presupuesto</p>
              <p className="font-medium">{lead.budget_answer || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Hardstop</p>
              <p className="font-medium">{lead.hardstop_reason || "Ninguno"}</p>
            </div>
            {lead.progress && (
              <>
                <div>
                  <p className="text-muted-foreground mb-1">F1 Video</p>
                  <p className="font-medium">{lead.progress.frag1_video_progress || 0}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">F1 Drops</p>
                  <p className="font-medium">{lead.progress.frag1_drops_captured?.length || 0}/3</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">F2 Video</p>
                  <p className="font-medium">{lead.progress.frag2_video_progress || 0}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">F2 Drops</p>
                  <p className="font-medium">{lead.progress.frag2_drops_captured?.length || 0}/5</p>
                </div>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    )}
  </>
);

export default function BrechaLeadsManager() {
  const { leads, loading, error, refetch } = useBrechaLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.ghl_contact_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Leads La Brecha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={refetch} className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Gestión de Leads La Brecha ({leads.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No se encontraron leads con ese criterio" : "No hay leads registrados aún"}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Fragmento</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isExpanded={expandedId === lead.id}
                    onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
