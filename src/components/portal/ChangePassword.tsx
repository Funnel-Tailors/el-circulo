import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, GlowInput } from "@/components/premium";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

export const ChangePassword = () => {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (pw.length < 6) return toast.error("Mínimo 6 caracteres");
    if (pw !== pw2) return toast.error("Las contraseñas no coinciden");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast.error("No se pudo cambiar la contraseña");
    setPw(""); setPw2(""); setOpen(false);
    toast.success("Contraseña actualizada");
  };

  return (
    <EnergyCard variant="default" enableTilt={false} beamIntensity={0.3}>
      <EnergyCardHeader>
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 w-full text-left">
          <KeyRound className="h-4 w-4 text-foreground/50" />
          <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">Cambiar contraseña</h2>
        </button>
      </EnergyCardHeader>
      {open && (
        <EnergyCardContent className="space-y-3">
          <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Nueva contraseña</Label><GlowInput type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Repítela</Label><GlowInput type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <Button variant="premium" onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar contraseña
          </Button>
        </EnergyCardContent>
      )}
    </EnergyCard>
  );
};
