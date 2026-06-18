import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, GlowInput } from "@/components/premium";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound, ChevronDown } from "lucide-react";

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
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-between w-full text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
              <KeyRound className="h-4 w-4 text-foreground/60" />
            </div>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90 group-hover:text-foreground transition-colors">
              Cambiar contraseña
            </h2>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-foreground/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </EnergyCardHeader>

      {open && (
        <EnergyCardContent className="space-y-4 pt-0">
          <div className="h-px bg-white/[0.06]" />
          <div className="space-y-1.5">
            <Label className="text-foreground/60 text-[11px] uppercase tracking-[0.1em]">Nueva contraseña</Label>
            <GlowInput type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground/60 text-[11px] uppercase tracking-[0.1em]">Repítela</Label>
            <GlowInput type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Misma contraseña" />
          </div>
          <Button variant="premium" onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar contraseña
          </Button>
        </EnergyCardContent>
      )}
    </EnergyCard>
  );
};
