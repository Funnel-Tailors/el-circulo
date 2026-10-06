import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAgreementHash, getAgreementText } from "@/data/consultoriaAgreement";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, GlowInput, MagneticButton } from "@/components/premium";

/**
 * Firma del acuerdo dentro del portal: el admin da de alta al cliente con una versión
 * asignada y el cliente no entra al portal hasta firmarla (sign-my-agreement).
 */
export const SignAgreementGate = ({ version, onSigned, onSignOut }: { version: string; onSigned: () => void; onSignOut: () => void }) => {
  const text = getAgreementText(version);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readToEnd, setReadToEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const checkEnd = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 16) setReadToEnd(true);
  };
  useEffect(checkEnd, []);

  // Clic en el check sin haber llegado al final: baja la caja hasta el final.
  const scrollToEnd = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });

  const sign = async () => {
    if (!accepted) return toast.error("Marca \"He leído y acepto\"");
    if (name.trim().length < 3) return toast.error("Escribe tu nombre completo");
    setBusy(true);
    const agreement_hash = await getAgreementHash(text);
    const { data, error } = await supabase.functions.invoke("sign-my-agreement", {
      body: { signer_name: name.trim(), accepted: true, agreement_version: version, agreement_hash },
    });
    setBusy(false);
    if (error || !(data as any)?.ok) return toast.error((data as any)?.error || "No se pudo firmar");
    toast.success("Acuerdo firmado");
    onSigned();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "hsl(0 0% 5%)" }}>
      <EnergyCard variant="elevated" enableTilt={false} className="w-full max-w-2xl" beamSpeed={4} beamIntensity={0.4}>
        <EnergyCardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-display font-black uppercase tracking-[-0.025em] text-xl text-foreground glow">Tu acuerdo de servicios</h1>
              <p className="text-sm text-foreground/60">Léelo y fírmalo para acceder a tu portal de cliente.</p>
            </div>
            <MagneticButton variant="ghost" size="sm" onClick={onSignOut} enableMagnetic={false} className="gap-2 text-foreground/60 hover:text-foreground"><LogOut className="h-4 w-4" /> Salir</MagneticButton>
          </div>
        </EnergyCardHeader>
        <EnergyCardContent className="space-y-4">
          <div className="relative">
            <div ref={scrollRef} onScroll={checkEnd} className="glass-card-dark max-h-[50vh] overflow-y-auto p-4 rounded-xl">
              <pre className="whitespace-pre-wrap font-sans text-xs text-foreground/75 leading-relaxed">{text}</pre>
            </div>
            {!readToEnd && (
              <>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 rounded-b-xl bg-gradient-to-t from-black/85 to-transparent" />
                <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-foreground/50">
                  <ChevronDown className="h-3 w-3 animate-bounce" /> Desplázate para leer
                </div>
              </>
            )}
          </div>
          <Label onClick={readToEnd ? undefined : scrollToEnd} className={`flex items-start gap-3 cursor-pointer ${readToEnd ? "" : "opacity-50"}`}>
            <Checkbox checked={accepted} disabled={!readToEnd} onCheckedChange={(c) => setAccepted(c === true)} className="mt-0.5" />
            <span className="text-sm text-foreground/90">
              He leído y acepto el acuerdo de prestación de servicios.
              {!readToEnd && <span className="text-foreground/40"> (lee hasta el final)</span>}
            </span>
          </Label>
          <div className="space-y-1.5">
            <Label htmlFor="sign-name" className="text-foreground/80 text-xs uppercase tracking-wider">Firma — escribe tu nombre completo</Label>
            <GlowInput id="sign-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" />
          </div>
          <Button variant="premium" className="w-full" onClick={sign} disabled={busy || !accepted || name.trim().length < 3}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Firmar y entrar
          </Button>
          <p className="text-[11px] text-foreground/40 text-center">La firma queda registrada con tu nombre, email, fecha, IP y un hash del documento. Podrás descargarlo después en Documentos.</p>
        </EnergyCardContent>
      </EnergyCard>
    </div>
  );
};
