import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSendaLeads, SendaLead } from '@/hooks/useSendaLeads';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RefreshCw, Eye, Ban, Undo2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const statusLabels: Record<SendaLead['sendaStatus'], { label: string; color: string }> = {
  no_access: { label: '⚪ Sin acceso', color: 'bg-muted text-muted-foreground' },
  visited: { label: '🟡 Visitó', color: 'bg-yellow-950/50 text-yellow-400 border-yellow-500/30' },
  watching: { label: '🟢 Viendo clase', color: 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30' },
  portal_shown: { label: '✨ Portal desbloqueado', color: 'bg-purple-950/50 text-purple-400 border-purple-500/30' },
  vault_revealed: { label: '🔮 En La Bóveda', color: 'bg-indigo-950/50 text-indigo-400 border-indigo-500/30' },
  revoked: { label: '🔴 Revocado', color: 'bg-red-950/50 text-red-400 border-red-500/30' },
};

const blacklistReasons = [
  { value: 'no_show', label: 'No apareció a la llamada' },
  { value: 'ghosted', label: 'Fantasma (no responde)' },
  { value: 'not_admitted', label: 'No admitido tras llamada' },
  { value: 'cancelled', label: 'Canceló a última hora' },
];

// Copys brutales para preview
const blacklistMessages: Record<string, { title: string; subtitle: string; message: string }> = {
  no_show: {
    title: "El Portal Se Cierra",
    subtitle: "No apareciste.",
    message: "Tenías una cita. La confirmaste. Y no apareciste. Mientras tú ignorabas el calendario, alguien del Círculo cerraba un proyecto de 5.000€ en esa misma hora. Eso es lo que cuesta un no-show."
  },
  ghosted: {
    title: "👻",
    subtitle: "Prometiste que no eras un fantasma.",
    message: "Te lo preguntamos directamente. Marcaste la casilla. \"No soy un fantasma. Voy a contestar.\" Y aquí estamos. Ghosting de manual. El Círculo no trabaja con gente que ignora WhatsApps como tú ignoras las revisiones de tus clientes."
  },
  not_admitted: {
    title: "La Senda No Es Para Ti",
    subtitle: "Esto no es un curso para curiosos.",
    message: "La llamada lo dejó claro: no estás donde necesitas estar para que esto funcione. Sigues vendiendo por cuatro duros. Sigues persiguiendo clientes de mierda. Sigues culpando al algoritmo. Cuando dejes de hacer todo eso, quizá nos crucemos. O quizá no."
  },
  cancelled: {
    title: "Cancelaste",
    subtitle: "A última hora. Como un profesional de manual.",
    message: "Bloqueaste un hueco que podría haber sido de alguien dispuesto a aparecer. Alguien que no cancela citas como cancela plazos de entrega. Alguien que respeta el tiempo de los demás porque respeta el suyo."
  },
};

const SendaLeadsManager = () => {
  const { leads, loading, fetchLeads, banLead, unbanLead } = useSendaLeads();
  const [selectedLead, setSelectedLead] = useState<SendaLead | null>(null);
  const [banReason, setBanReason] = useState<string>('no_show');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReason, setPreviewReason] = useState<string>('no_show');

  const handleBan = async (lead: SendaLead) => {
    try {
      await banLead(lead.ghlContactId, lead.name, banReason);
      toast({ title: 'Acceso revocado', description: `${lead.name} ya no puede acceder a /senda` });
      setSelectedLead(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo revocar el acceso' });
    }
  };

  const handleUnban = async (lead: SendaLead) => {
    try {
      await unbanLead(lead.ghlContactId);
      toast({ title: 'Acceso restaurado', description: `${lead.name} puede volver a acceder` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo restaurar el acceso' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-foreground/30">⟡</span>
            Gestión de Leads
            <span className="text-foreground/30">⟡</span>
          </h2>
          <p className="text-foreground/60 text-sm mt-1">
            {leads.length} leads • {leads.filter(l => l.sendaStatus === 'revoked').length} revocados
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
            onClick={fetchLeads}
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
                <th className="text-left p-4 text-foreground/70 font-medium text-sm">Fecha</th>
                <th className="text-left p-4 text-foreground/70 font-medium text-sm">Token</th>
                <th className="text-left p-4 text-foreground/70 font-medium text-sm">Estado Senda</th>
                <th className="text-right p-4 text-foreground/70 font-medium text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr 
                  key={lead.ghlContactId} 
                  className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-foreground/50">{lead.phone}</p>
                    </div>
                  </td>
                  <td className="p-4 text-foreground/70 text-sm">
                    {formatDistanceToNow(new Date(lead.submittedAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="p-4">
                    <code className="text-xs bg-foreground/10 px-2 py-1 rounded text-foreground/60">
                      {lead.ghlContactId.slice(0, 8)}...
                    </code>
                  </td>
                  <td className="p-4">
                    <Badge className={`${statusLabels[lead.sendaStatus].color} border`}>
                      {statusLabels[lead.sendaStatus].label}
                      {lead.sendaStatus === 'watching' && lead.videoProgress > 0 && (
                        <span className="ml-1">({lead.videoProgress}%)</span>
                      )}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {lead.isBlacklisted ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnban(lead)}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                        >
                          <Undo2 className="w-4 h-4 mr-1" />
                          Restaurar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Revocar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revocar acceso de {selectedLead?.name}</DialogTitle>
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
    </div>
  );
};

export default SendaLeadsManager;
