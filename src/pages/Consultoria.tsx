import "@/components/premium/premium-effects.css";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowDown, Check } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MagneticButton } from "@/components/premium/MagneticButton";
import { SpotlightCard } from "@/components/premium/SpotlightCard";

/**
 * /consultoria — Guión visual de venta consultiva high-ticket (presenter-led).
 * Mikel comparte pantalla y NARRA; el copy en pantalla son anclas, no párrafos.
 * Arco consultivo (7 beats): Diagnóstico → Gap → Reframe → Mecanismo →
 * Roadmap+Prueba → Inversión → Compromiso.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const Beat = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, ease: EASE }}
    className={`max-w-4xl mx-auto px-5 py-20 sm:py-28 ${className}`}
  >
    {children}
  </motion.section>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] uppercase tracking-[0.28em] text-foreground/40 mb-6">{children}</p>
);

const Divider = () => (
  <div className="max-w-4xl mx-auto px-5">
    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const Consultoria = () => {
  const navigate = useNavigate();

  const { data: enabled, isLoading } = useQuery({
    queryKey: ["consulting-enabled"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "consulting_enabled").maybeSingle();
      return data?.value === true || data?.value === "true";
    },
  });

  const goOnboarding = () => navigate("/consultoria/onboarding");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(0 0% 5%)" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center px-4 text-center" style={{ background: "hsl(0 0% 5%)" }}>
        <div>
          <h1 className="font-display font-black text-2xl uppercase glow mb-2">El Círculo</h1>
          <p className="text-foreground/50 text-sm">La consultoría no está abierta ahora mismo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: "hsl(0 0% 5%)" }}>
      {/* ── BEAT 1 · DIAGNÓSTICO ── */}
      <Beat className="text-center min-h-screen flex flex-col justify-center">
        <Eyebrow>El Espejo · Diagnóstico</Eyebrow>
        <h1 className="font-display font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-6xl">
          Ejecutas de lujo.<br />Pero <span className="glow">vendes a ciegas</span>.
        </h1>
        <div className="mt-12 grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
          {[
            "Mes bueno: €15k. Mes malo: rezando.",
            "Tu pipeline no es un pipeline. Es la suerte.",
            "El último “sí” llegó por un favor, no por un sistema.",
            "Y encima te regatean hasta los €400.",
          ].map((t) => (
            <div key={t} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
              <span className="text-sm text-foreground/80">{t}</span>
            </div>
          ))}
        </div>
      </Beat>

      <Divider />

      {/* ── BEAT 2 · EL GAP / COSTE DE NO ACTUAR ── */}
      <Beat className="text-center">
        <Eyebrow>La hemorragia</Eyebrow>
        <h2 className="font-display font-black uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl">
          Cada mes que sigues igual<br />tiene precio.
        </h2>
        <div className="mt-14">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/40 mb-3">Esperar un año te cuesta</div>
          <div className="font-display font-black tracking-tight text-7xl sm:text-8xl text-red-500/90"
            style={{ textShadow: "0 0 40px rgba(239,68,68,0.25)" }}>
            −€120.000
          </div>
          <p className="mt-6 text-foreground/70 max-w-md mx-auto">
            Meta: <span className="text-foreground">+€10k/mes</span> · 12 meses esperando al boca a boca ·
            dinero que <span className="text-foreground">no vuelve</span>.
          </p>
          <p className="mt-3 text-sm text-foreground/50">No es un gasto. Es una hemorragia.</p>
        </div>
      </Beat>

      <Divider />

      {/* ── BEAT 3 · EL REFRAME ── */}
      <Beat className="text-center">
        <Eyebrow>Por qué currar más no lo arregla</Eyebrow>
        <h2 className="font-display font-black uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl">
          Currar más no lo arregla.<br />Ya lo has probado.
        </h2>
        <div className="mt-12 grid gap-2.5 max-w-xl mx-auto text-left">
          {[
            ["Postear más en Insta", "ruido, no clientes."],
            ["Pedir más referidos", "más clientes ratilla."],
            ["“Tira unos ads”", "quemas pasta sin oferta detrás."],
            ["Contratar un junior", "ejecutas más de lo que no vende."],
          ].map(([bad, why]) => (
            <div key={bad} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <span className="text-sm text-foreground/40 line-through">{bad}</span>
              <span className="text-sm text-foreground/70 text-right">→ {why}</span>
            </div>
          ))}
        </div>
        <p className="mt-12 font-display font-black uppercase text-2xl sm:text-3xl leading-tight">
          No tienes un problema de marketing.<br />Tienes un problema de <span className="glow">sistema</span>.
        </p>
      </Beat>

      <Divider />

      {/* ── BEAT 4 · EL MECANISMO ── */}
      <Beat className="text-center">
        <Eyebrow>El mecanismo</Eyebrow>
        <h2 className="font-display font-black uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl">
          Te montamos la máquina.<br />Y te damos las <span className="glow">llaves</span>.
        </h2>
        <div className="mt-12 flex flex-col items-stretch gap-2.5 max-w-md mx-auto">
          {[
            ["Oferta", "que nadie regatea"],
            ["ICP", "a quién, dónde, con qué mensaje"],
            ["Anuncios", "que traen al cliente correcto"],
            ["CRM + Embudo", "conectados, nada se cae"],
            ["Tu VSL", "vende por ti mientras duermes"],
          ].map(([piece, desc], i, arr) => (
            <div key={piece} className="relative">
              <SpotlightCard padded={false} className="flex items-center gap-4 px-5 py-3.5">
                <span className="font-display font-black text-lg text-foreground/30 w-6">{i + 1}</span>
                <div className="text-left">
                  <div className="font-semibold text-sm">{piece}</div>
                  <div className="text-xs text-foreground/60">{desc}</div>
                </div>
              </SpotlightCard>
              {i < arr.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="h-3.5 w-3.5 text-white/25" />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-10 font-display font-black uppercase text-xl sm:text-2xl leading-tight max-w-2xl mx-auto">
          No te damos tácticas sueltas. Te montamos el sistema entero. <span className="glow">Done-For-You</span>.
        </p>
      </Beat>

      <Divider />

      {/* ── BEAT 5 · ROADMAP + PRUEBA ── */}
      <Beat>
        <div className="text-center">
          <Eyebrow>El Ascenso · 90 días</Eyebrow>
          <h2 className="font-display font-black uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl">
            De rezar a <span className="glow">predecir</span>.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-2 gap-8">
          {/* Roadmap */}
          <div className="space-y-3">
            {[
              ["Mes 1 · Cimientos", "Oferta, ICP y rebranding si hace falta. Dejas de competir por precio."],
              ["Mes 2 · La máquina", "Anuncios, CRM, embudo y tu VSL grabada y conectada."],
              ["Mes 3 · Encendido", "Pipeline funcionando. Entran llamadas que no te conocían de nada."],
            ].map(([m, d], i) => (
              <div key={m} className="flex gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
                <span className="font-display font-black text-2xl text-foreground/25">{i + 1}</span>
                <div>
                  <div className="font-semibold text-sm">{m}</div>
                  <div className="text-xs text-foreground/65 mt-0.5">{d}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Ascendidos */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">Los Ascendidos</div>
            {[
              ["Nico", "De €200 por web →", "€5.000 en UNA llamada."],
              ["Felipe", "Dos llamadas, 7 días →", "€2.000 + €5.000."],
            ].map(([name, ctx, result]) => (
              <SpotlightCard key={name} className="text-left">
                <div className="text-xs text-foreground/50">{name}</div>
                <div className="text-sm text-foreground/70 mt-1">{ctx}</div>
                <div className="font-display font-black text-xl mt-1 glow">{result}</div>
              </SpotlightCard>
            ))}
            <p className="text-xs text-foreground/40 italic px-1">
              No ejecutan mejor que tú. Solo dejaron de vender a ciegas.
            </p>
          </div>
        </div>
      </Beat>

      <Divider />

      {/* ── BEAT 6 · LA INVERSIÓN / ROI ── */}
      <Beat className="text-center">
        <Eyebrow>Hagamos números de verdad</Eyebrow>
        <h2 className="font-display font-black uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl">
          La cuenta que lo deja claro.
        </h2>
        <div className="mt-12 max-w-lg mx-auto space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-5 py-4">
            <span className="text-sm text-foreground/60 text-left">No actuar un año<br /><span className="text-xs text-foreground/40">la hemorragia</span></span>
            <span className="font-display font-black text-2xl text-red-500/80">−€120.000</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-5 py-4">
            <span className="text-sm text-foreground/60 text-left">Montarlo tú en casa<br /><span className="text-xs text-foreground/40">contratar + tools + 12 meses</span></span>
            <span className="font-display font-black text-2xl text-foreground/55">≈ €45.000</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/[0.04] px-5 py-5 shadow-glow-md">
            <span className="text-sm text-foreground text-left">Tu inversión en El Ascenso</span>
            <span className="font-display font-black text-4xl glow">€8.000</span>
          </div>
        </div>
        <p className="mt-10 font-display font-black uppercase text-xl sm:text-2xl">
          Se paga con el primer cliente.<br />O con los dos primeros.
        </p>
      </Beat>

      <Divider />

      {/* ── BEAT 7 · EL COMPROMISO ── */}
      <Beat className="text-center min-h-[90vh] flex flex-col justify-center">
        <Eyebrow>El compromiso</Eyebrow>
        <h2 className="font-display font-black uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl">
          Dos tipos de agencia<br />salen de esta llamada.
        </h2>
        <div className="mt-12 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-foreground/55">
            <div className="text-xs uppercase tracking-wide mb-2">Las que</div>
            <div className="font-display font-black uppercase text-xl leading-tight">Siguen rezando<br />cada día 1.</div>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/[0.04] p-6 shadow-glow-md">
            <div className="text-xs uppercase tracking-wide mb-2 text-foreground/60">Las que</div>
            <div className="font-display font-black uppercase text-xl leading-tight glow">Montan la máquina<br />y dejan la suerte.</div>
          </div>
        </div>

        <div className="mt-10 grid gap-2 max-w-xl mx-auto text-left">
          {[
            "Trabajamos por fases con hitos. Ves la máquina montarse pieza a pieza.",
            "DFY de verdad: lo hace mi equipo, no una plantilla por email.",
            "Por eso montamos pocos al mes. No es escasez de marketing — es que cada uno lo hacemos a mano.",
          ].map((t) => (
            <div key={t} className="flex items-start gap-3 text-sm text-foreground/70">
              <Check className="h-4 w-4 text-emerald-400/80 shrink-0 mt-0.5" />
              <span>{t}</span>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <MagneticButton variant="default" size="xl" onClick={goOnboarding} className="animate-glow-pulse-intense">
            Reservar plaza y arrancar el onboarding <ArrowRight className="h-5 w-5" />
          </MagneticButton>
        </div>
      </Beat>
    </div>
  );
};

export default Consultoria;
