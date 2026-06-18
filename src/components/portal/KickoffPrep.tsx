import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, GlowInput, GlowTextarea } from "@/components/premium";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Check, Zap } from "lucide-react";

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

  if (loading) return (
    <EnergyCard variant="default" enableTilt={false}>
      <EnergyCardContent>
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
        </div>
      </EnergyCardContent>
    </EnergyCard>
  );

  return (
    <EnergyCard variant="default" beamSpeed={5} beamIntensity={0.5} enableTilt={false}>
      <EnergyCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
            <Zap className="h-4 w-4 text-foreground/60" />
          </div>
          <div>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
              Prepara tu <span className="glow">kickoff</span>
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">
              Rellena esto y tu llamada irá a degüello. Cuanto más claro, más rápido arrancamos.
            </p>
          </div>
        </div>
      </EnergyCardHeader>

      <EnergyCardContent className="space-y-6">
        {/* Main fields — 2-col sm, 3-col xl */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-foreground/60 text-[11px] uppercase tracking-[0.1em]">Tu oferta en 1 línea</Label>
            <GlowInput value={prep.offer_oneliner} onChange={(e) => set("offer_oneliner", e.target.value)} placeholder="Qué vendes y a quién" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground/60 text-[11px] uppercase tracking-[0.1em]">Facturación media/mes</Label>
            <GlowInput value={prep.monthly_revenue} onChange={(e) => set("monthly_revenue", e.target.value)} placeholder="€…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground/60 text-[11px] uppercase tracking-[0.1em]">Web / Instagram</Label>
            <GlowInput value={prep.links} onChange={(e) => set("links", e.target.value)} placeholder="tuweb.com / @tuhandle" />
          </div>
          <div className="space-y-1.5 sm:col-span-2 xl:col-span-3">
            <Label className="text-foreground/60 text-[11px] uppercase tracking-[0.1em]">Tu objetivo a 90 días</Label>
            <GlowInput value={prep.goal_90d} onChange={(e) => set("goal_90d", e.target.value)} placeholder="+€10k/mes, 20 clientes, escalar X proceso…" />
          </div>
        </div>

        {/* Textarea — full width */}
        <div className="space-y-1.5">
          <Label className="text-foreground/60 text-[11px] uppercase tracking-[0.1em]">¿Qué vendes exactamente? (servicios, precios)</Label>
          <GlowTextarea value={prep.sells} onChange={(e) => set("sells", e.target.value)} placeholder="Cuéntame en 2 líneas" />
        </div>

        {/* Checklist */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/35 font-display font-black mb-3">
            Ten esto a mano para la llamada
          </div>
          {CHECKLIST.map((c) => {
            const checked = !!prep.checklist[c.key];
            return (
              <label
                key={c.key}
                className="flex items-center gap-3 cursor-pointer text-sm text-foreground/70 hover:text-foreground/90 transition-colors duration-150"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(c.key)} />
                <span className={checked ? "text-foreground/90 line-through decoration-foreground/20" : ""}>{c.label}</span>
              </label>
            );
          })}
        </div>

        {/* White-glove message */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
          <ShieldCheck className="h-4 w-4 text-emerald-400/70 shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/60 leading-relaxed">
            En la llamada te acompaño <span className="text-foreground/90 font-medium">personalmente</span> a conectar tus cuentas.{" "}
            <span className="text-foreground/90 font-medium">No pegues contraseñas aquí.</span>
          </p>
        </div>

        {/* CTA */}
        <Button variant="premium" onClick={save} disabled={saving} className="w-full">
          {saving
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : prep.submitted_at
              ? <Check className="h-4 w-4" />
              : null}
          {prep.submitted_at ? "Guardado — actualizar" : "Guardar para mi kickoff"}
        </Button>
      </EnergyCardContent>
    </EnergyCard>
  );
};
