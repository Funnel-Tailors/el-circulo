import { useState } from "react";
import { formatDistanceToNow, format, differenceInHours, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RefreshCw, Eye, Ban, Undo2, CalendarIcon, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBrechaLeads, BrechaLeadWithProgress, BrechaStatus } from "@/hooks/useBrechaLeads";
import { BrechaProgressBar } from "./BrechaProgressBar";

const statusLabels: Record<BrechaStatus, { label: string; color: string }> = {
  no_access: { label: '⚪ Sin acceso', color: 'bg-muted text-muted-foreground' },
  frag1: { label: '💰 Fragmento 1', color: 'bg-yellow-950/50 text-yellow-400 border-yellow-500/30' },
  portal1_ready: { label: '🌀 Portal 1 listo', color: 'bg-purple-950/50 text-purple-400 border-purple-500/30' },
  frag2: { label: '🎭 Fragmento 2', color: 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30' },
  portal2_ready: { label: '🌀 Portal 2 listo', color: 'bg-purple-950/50 text-purple-400 border-purple-500/30' },
  frag3: { label: '⚙️ Fragmento 3', color: 'bg-cyan-950/50 text-cyan-400 border-cyan-500/30' },
  portal3_ready: { label: '🌀 Portal 3 listo', color: 'bg-purple-950/50 text-purple-400 border-purple-500/30' },
  frag4: { label: '🎯 Fragmento 4', color: 'bg-orange-950/50 text-orange-400 border-orange-500/30' },
  completed: { label: '✅ Completado', color: 'bg-emerald-950/50 text-emerald-300 border-emerald-400/30' },
  revoked: { label: '🔴 Revocado', color: 'bg-red-950/50 text-red-400 border-red-500/30' },
};

const blacklistReasons = [
  { value: 'no_show', label: 'No apareció a la llamada' },
  { value: 'ghosted', label: 'Fantasma (no responde)' },
  { value: 'not_admitted', label: 'No admitido tras llamada' },
  { value: 'cancelled', label: 'Canceló a última hora' },
  { value: 'low_commitment', label: 'Sin compromiso real' },
];

const blacklistMessages: Record<string, { title: string; subtitle: string; message: string }> = {
  no_show: {
    title: "La Grieta Se Cierra",
    subtitle: "No cruzaste.",
    message: "Tenías una cita con tu transformación. La confirmaste. Y no apareciste. Mientras tú ignorabas el calendario, alguien más cruzó La Brecha y nunca volvió a mirar atrás."
  },
  ghosted: {
    title: "👻",
    subtitle: "El fantasma no cruza La Brecha.",
    message: "Te lo preguntamos directamente. Prometiste que responderías. Y aquí estamos. Ghosting de manual. La Brecha no se abre para gente que ignora mensajes como ignora oportunidades."
  },
  not_admitted: {
    title: "La Brecha No Es Para Ti",
    subtitle: "Aún no estás listo.",
    message: "La llamada lo dejó claro: no estás donde necesitas estar para cruzar. Sigues atrapado en el lado equivocado. Cuando dejes de hacer las cosas que te mantienen ahí, quizá nos crucemos. O quizá no."
  },
  cancelled: {
    title: "Cancelaste",
    subtitle: "A última hora. Como siempre.",
    message: "Bloqueaste un hueco que podría haber sido de alguien dispuesto a cruzar. Alguien que no cancela citas como cancela sueños. Alguien que respeta el tiempo de los demás porque respeta el suyo."
  },
  low_commitment: {
    title: "Sin Compromiso",
    subtitle: "La Brecha detecta la tibieza.",
    message: "No puedes cruzar La Brecha a medias. No hay camino intermedio. La gente que duda en el borde se queda ahí para siempre, mirando cómo otros cruzan mientras ellos buscan excusas."
  },
};

const getTierBadge = (tier: string | null, isQualified: boolean | null) => {
  if (tier === "premium") return <Badge className="bg-amber-500 hover:bg-amber-500/80">Premium</Badge>;
  if (tier === "full_access") return <Badge className="bg-green-500 hover:bg-green-500/80">Full Access</Badge>;
  if (tier === "offer_only") return <Badge variant="secondary">Solo Oferta</Badge>;
  if (isQualified === false) return <Badge variant="destructive">Descualificado</Badge>;
  return <Badge variant="outline">Pendiente</Badge>;
};

const renderExpirationInfo = (lead: BrechaLeadWithProgress) => {
  if (lead.journeyCompleted) {
    return <span className="text-emerald-400 text-xs">✅ Completado</span>;
  }
  
  if (lead.callScheduledAt) {
    const callDate = new Date(lead.callScheduledAt);
    return (
      <span className="text-purple-400 text-xs">
        📅 {format(callDate, "d MMM HH:mm", { locale: es })}
      </span>
    );
  }
  
  return <span className="text-foreground/30 text-xs">—</span>;
};

export default function BrechaLeadsManager() {
  const { 
    leads, 
    loading, 
    refetch, 
    banLead, 
    unbanLead, 
    scheduleCall, 
    markCompleted, 
    unlockMilestone, 
    resetMilestone 
  } = useBrechaLeads();
  
  const [selectedLead, setSelectedLead] = useState<BrechaLeadWithProgress | null>(null);
  const [banReason, setBanReason] = useState<string>('no_show');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReason, setPreviewReason] = useState<string>('no_show');
  const [scheduleLeadToken, setScheduleLeadToken] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("10:00");
  const [resetConfirmation, setResetConfirmation] = useState<{
    token: string;
    milestone: string;
    leadName: string;
  } | null>(null);

  const handleResetWithConfirmation = (token: string, leadName: string, journeyCompleted: boolean) => 
    async (milestone: string) => {
      if (journeyCompleted) {
        setResetConfirmation({ token, milestone, leadName });
      } else {
        await resetMilestone(token, milestone);
        toast({ title: 'Milestone reseteado' });
      }
    };

  const handleBan = async (lead: BrechaLeadWithProgress) => {
    try {
      await banLead(lead.token, lead.first_name || 'Sin nombre', banReason);
      toast({ title: 'Acceso revocado', description: `${lead.first_name} ya no puede acceder a La Brecha` });
      setSelectedLead(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo revocar el acceso' });
    }
  };

  const handleUnban = async (lead: BrechaLeadWithProgress) => {
    try {
      await unbanLead(lead.token);
      toast({ title: 'Acceso restaurado', description: `${lead.first_name} puede volver a acceder` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo restaurar el acceso' });
    }
  };

  const handleScheduleCall = async (token: string) => {
    if (!selectedDate) return;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    
    try {
      await scheduleCall(token, combinedDate);
      toast({ title: 'Llamada registrada', description: `${format(combinedDate, "d 'de' MMMM 'a las' HH:mm", { locale: es })}` });
      setScheduleLeadToken(null);
      setSelectedDate(undefined);
      setSelectedTime("10:00");
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar la llamada' });
    }
  };

  const handleMarkCompleted = async (lead: BrechaLeadWithProgress) => {
    try {
      await markCompleted(lead.token);
      toast({ title: 'Journey completado', description: `${lead.first_name} marcado como completado` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo marcar como completado' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-foreground/30">⟡</span>
            Gestión de Leads La Brecha
            <span className="text-foreground/30">⟡</span>
          </h2>
          <p className="text-foreground/60 text-sm mt-1">
            {leads.length} leads • {leads.filter(l => l.brechaStatus === 'completed').length} completados • {leads.filter(l => l.brechaStatus === 'revoked').length} revocados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Copys
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-dark rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground/10">
                <th className="text-left p-4 text-foreground/70 font-medium text-sm">Nombre</th>
                <th className="text-left p-4 text-foreground/70 font-medium text-sm">Tier</th>
                <th className="text-left p-4 text-foreground/70 font-medium text-sm">Fecha</th>
                <th className="text-left p-4 text-foreground/70 font-medium text-sm">Estado</th>
                <th className="text-left p-4 text-foreground/70 font-medium text-sm">Llamada</th>
                <th className="text-right p-4 text-foreground/70 font-medium text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <>
                  <tr 
                    key={lead.id} 
                    className="border-b border-foreground/5"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{lead.first_name || 'Sin nombre'}</p>
                        <p className="text-xs text-foreground/50">{lead.token.slice(0, 12)}...</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {getTierBadge(lead.tier, lead.is_qualified)}
                    </td>
                    <td className="p-4 text-foreground/70 text-sm">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: es })}
                    </td>
                    <td className="p-4">
                      <Badge className={`${statusLabels[lead.brechaStatus].color} border`}>
                        {statusLabels[lead.brechaStatus].label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {renderExpirationInfo(lead)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Schedule call button */}
                        {!lead.isBlacklisted && (
                          <Popover open={scheduleLeadToken === lead.token} onOpenChange={(open) => {
                            if (!open) {
                              setScheduleLeadToken(null);
                              setSelectedDate(undefined);
                              setSelectedTime("10:00");
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setScheduleLeadToken(lead.token)}
                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30"
                                title="Registrar fecha de llamada"
                              >
                                <CalendarIcon className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                              <div className="p-3 border-t border-foreground/10 space-y-3">
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Hora" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
                                      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
                                      "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
                                      "18:00", "18:30", "19:00", "19:30", "20:00"].map(time => (
                                      <SelectItem key={time} value={time}>{time}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  size="sm" 
                                  className="w-full"
                                  disabled={!selectedDate}
                                  onClick={() => handleScheduleCall(lead.token)}
                                >
                                  Registrar llamada
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}

                        {/* Mark completed button */}
                        {!lead.isBlacklisted && !lead.journeyCompleted && lead.brechaStatus !== 'no_access' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkCompleted(lead)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Ban/Unban */}
                        {lead.isBlacklisted ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnban(lead)}
                            className="text-foreground/50 hover:text-foreground hover:bg-foreground/10"
                          >
                            <Undo2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Progress bar row - only show for leads that have started */}
                  {lead.progress && lead.brechaStatus !== 'no_access' && lead.brechaStatus !== 'revoked' && (
                    <tr key={`${lead.id}-progress`}>
                      <td colSpan={6} className="px-4 pb-4">
                        <BrechaProgressBar
                          progress={lead.progress}
                          leadName={lead.first_name || 'Lead'}
                          onUnlockMilestone={(milestone) => unlockMilestone(lead.token, milestone)}
                          onResetMilestone={handleResetWithConfirmation(lead.token, lead.first_name || 'Lead', lead.journeyCompleted)}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revocar acceso de {selectedLead?.first_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-foreground/70 mb-2 block">Motivo:</label>
              <Select value={banReason} onValueChange={setBanReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {blacklistReasons.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview del mensaje */}
            <div className="bg-background/50 border border-foreground/10 rounded-lg p-4">
              <p className="text-xs text-foreground/50 mb-2">Verá este mensaje:</p>
              <h4 className="font-bold text-foreground">{blacklistMessages[banReason]?.title}</h4>
              <p className="text-sm text-foreground/70 mt-1">{blacklistMessages[banReason]?.subtitle}</p>
              <p className="text-xs text-foreground/50 mt-2">{blacklistMessages[banReason]?.message}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedLead && handleBan(selectedLead)}
              >
                Revocar Acceso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Copys Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview de Mensajes de Revocación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={previewReason} onValueChange={setPreviewReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {blacklistReasons.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="bg-background border border-foreground/10 rounded-xl p-6 text-center">
              <span className="text-4xl block mb-4">🚫</span>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {blacklistMessages[previewReason]?.title}
              </h3>
              <p className="text-lg text-foreground/80 mb-4">
                {blacklistMessages[previewReason]?.subtitle}
              </p>
              <p className="text-sm text-foreground/60">
                {blacklistMessages[previewReason]?.message}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={!!resetConfirmation} onOpenChange={() => setResetConfirmation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Confirmar reset</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-foreground/70">
              <strong>{resetConfirmation?.leadName}</strong> ha completado el journey. 
              ¿Estás seguro de querer resetear <code className="bg-foreground/10 px-1 rounded">{resetConfirmation?.milestone}</code>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetConfirmation(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={async () => {
                  if (resetConfirmation) {
                    await resetMilestone(resetConfirmation.token, resetConfirmation.milestone);
                    toast({ title: 'Milestone reseteado' });
                    setResetConfirmation(null);
                  }
                }}
              >
                Sí, resetear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
