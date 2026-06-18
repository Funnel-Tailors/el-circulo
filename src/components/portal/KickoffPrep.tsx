import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, GlowInput, GlowTextarea } from "@/components/premium";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Check } from "lucide-react";

const CHECKLIST: { key: string; label: string }[] = [
  { key: "meta_ads", label: "Acceso a tu cuenta de Meta Ads (Business Manager)" },
  { key: "crm", label: "Tu CRM actual, si tienes (o ninguno)" },
  { key: "web", label: "Acceso a tu web / hosting / dominio" },
  { key: "brand", label: "Marca: logos, colores, tipografías" },
  { key: "calendar", label: "Tu calendario para conectar las reservas" },
];

interface Prep {
  offer_oneliner: string;
  monthly_revenue: string;
  sells: string;
  links: string;
  goal_90d: string;
  checklist: Record<string, boolean>;
  submitted_at: string | null;
}

const EMPTY: Prep = { offer_oneliner: "", monthly_revenue: "", sells: "", links: "", goal_90d: "", checklist: {}, submitted_at: null };

export const KickoffPrep = () => {
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [prep, setPrep] = useState<Prep>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: ob } = await supabase
        .from("consulting_onboardings")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ob) { setLoading(false); return; }
      setOnboardingId(ob.id);
      const { data: row } = await supabase
        .from("consulting_kickoff_prep")
        .select("offer_oneliner, monthly_revenue, sells, links, goal_90d, checklist, submitted_at")
        .eq("onboarding_id", ob.id)
        .maybeSingle();
      if (row) setPrep({ ...EMPTY, ...row, checklist: (row.checklist as any) || {} });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!onboardingId) return;
    setSaving(true);
    const { error } = await supabase.from("consulting_kickoff_prep").upsert(
      { onboarding_id: onboardingId, ...prep, submitted_at: new Date().toISOString() },
      { onConflict: "onboarding_id" },
    );
    setSaving(false);
    if (error) return toast.error("No se pudo guardar");
    setPrep((p) => ({ ...p, submitted_at: new Date().toISOString() }));
    toast.success("¡Listo! Lo reviso antes de tu kickoff.");
  };

  const set = (k: keyof Prep, v: any) => setPrep((p) => ({ ...p, [k]: v }));
  const toggle = (k: string) => setPrep((p) => ({ ...p, checklist: { ...p.checklist, [k]: !p.checklist[k] } }));

  if (loading) return <EnergyCard variant="default" enableTilt={false}><EnergyCardContent><div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div></EnergyCardContent></EnergyCard>;

  return (
    <EnergyCard variant="default" beamSpeed={5} beamIntensity={0.5} enableTilt={false}>
      <EnergyCardHeader>
        <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
          Prepara tu <span className="glow">kickoff</span>
        </h2>
        <p className="text-xs text-foreground/60 mt-1">
          Rellena esto y tu llamada irá a degüello. Cuanto más claro, más rápido arrancamos.
        </p>
      </EnergyCardHeader>
      <EnergyCardContent className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Tu oferta en 1 línea</Label><GlowInput value={prep.offer_oneliner} onChange={(e) => set("offer_oneliner", e.target.value)} placeholder="Qué vendes y a quién" /></div>
          <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Facturación media/mes</Label><GlowInput value={prep.monthly_revenue} onChange={(e) => set("monthly_revenue", e.target.value)} placeholder="€…" /></div>
          <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Web / Instagram</Label><GlowInput value={prep.links} onChange={(e) => set("links", e.target.value)} placeholder="links" /></div>
          <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Tu objetivo a 90 días</Label><GlowInput value={prep.goal_90d} onChange={(e) => set("goal_90d", e.target.value)} placeholder="+€10k/mes, etc." /></div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground/80 text-xs">¿Qué vendes exactamente? (servicios, precios)</Label>
          <GlowTextarea value={prep.sells} onChange={(e) => set("sells", e.target.value)} placeholder="Cuéntame en 2 líneas" />
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-2">Ten esto a mano para la llamada</div>
          <div className="space-y-2">
            {CHECKLIST.map((c) => (
              <label key={c.key} className="flex items-center gap-3 cursor-pointer text-sm text-foreground/85">
                <Checkbox checked={!!prep.checklist[c.key]} onCheckedChange={() => toggle(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-foreground/70">
          <ShieldCheck className="h-4 w-4 text-emerald-400/80 shrink-0 mt-0.5" />
          <span>En la llamada te acompaño <span className="text-foreground">personalmente</span> a conectar tus cuentas. <span className="text-foreground">No pegues contraseñas aquí.</span></span>
        </div>

        <Button variant="premium" onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : prep.submitted_at ? <Check className="h-4 w-4" /> : null}
          {prep.submitted_at ? "Guardado — actualizar" : "Guardar para mi kickoff"}
        </Button>
      </EnergyCardContent>
    </EnergyCard>
  );
};
