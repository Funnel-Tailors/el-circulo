import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { MagneticButton } from "@/components/premium/MagneticButton";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import { useConsultingConfig, fmtMoney, type ConsultingConfig } from "@/hooks/useConsultingConfig";
import { AscensoRoadmap } from "./AscensoRoadmap";
import { ASCENDIDOS } from "./data";
import "@/components/premium/premium-effects.css";

// Deck a pantalla completa para pitchear en llamada. Arco de cierre high-ticket
// (Gap → value equation → poder de decidir), fundamentado en $100M Closing.
const EASE = [0.16, 1, 0.3, 1] as const;

interface Ctx {
  config?: ConsultingConfig;
  goOnboarding: () => void;
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-6 text-[11px] uppercase tracking-[0.28em] text-foreground/40">{children}</p>
);

// Cada slide es una pantalla completa, centrada.
const Shell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex min-h-full flex-col items-center justify-center px-5 py-20 text-center ${className}`}>
    <div className="mx-auto w-full max-w-4xl">{children}</div>
  </div>
);

const SLIDES: { id: string; label: string; render: (ctx: Ctx) => React.ReactNode }[] = [
  // 1 ── Portada / hook
  {
    id: "portada",
    label: "Apertura",
    render: () => (
      <Shell>
        <Eyebrow>El Ascenso · sistema de adquisición Done-For-You</Eyebrow>
        <h1 className="font-display text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl">
          Ejecutas de lujo.
          <br />
          Pero <span className="glow">vendes a ciegas</span>.
        </h1>
        <p className="mx-auto mt-8 max-w-lg text-foreground/55">
          En los próximos minutos te enseño, con fechas, cómo dejas de depender de la suerte.
        </p>
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-foreground/35">
          <span>Avanza con</span>
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono">→</kbd>
          <span>o haz click</span>
        </div>
      </Shell>
    ),
  },
  // 2 ── El Espejo (estado actual)
  {
    id: "espejo",
    label: "El Espejo",
    render: () => (
      <Shell>
        <Eyebrow>El Espejo · diagnóstico</Eyebrow>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          Donde estás <span className="glow">hoy</span>.
        </h2>
        <div className="mx-auto mt-12 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
          {[
            "Mes bueno: €15k. Mes malo: rezando.",
            "Tu pipeline no es un pipeline. Es la suerte.",
            "El último “sí” llegó por un favor, no por un sistema.",
            "Y encima te regatean hasta los €400.",
          ].map((t) => (
            <div key={t} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
              <span className="text-sm text-foreground/80">{t}</span>
            </div>
          ))}
        </div>
      </Shell>
    ),
  },
  // 3 ── El coste de no actuar
  {
    id: "coste",
    label: "El coste",
    render: () => (
      <Shell>
        <Eyebrow>La hemorragia</Eyebrow>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          Cada mes que sigues igual
          <br />
          tiene precio.
        </h2>
        <div className="mt-14">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-foreground/40">Esperar un año te cuesta</div>
          <div
            className="font-display text-7xl font-black tracking-tight text-red-500/90 sm:text-8xl"
            style={{ textShadow: "0 0 40px rgba(239,68,68,0.25)" }}
          >
            −€120.000
          </div>
          <p className="mx-auto mt-6 max-w-md text-foreground/70">
            Meta: <span className="text-foreground">+€10k/mes</span> · 12 meses esperando al boca a boca · dinero que{" "}
            <span className="text-foreground">no vuelve</span>.
          </p>
          <p className="mt-3 text-sm text-foreground/50">No es un gasto. Es una hemorragia.</p>
        </div>
      </Shell>
    ),
  },
  // 4 ── Reframe
  {
    id: "reframe",
    label: "El reframe",
    render: () => (
      <Shell>
        <Eyebrow>Por qué currar más no lo arregla</Eyebrow>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          Currar más no lo arregla.
          <br />
          Ya lo has probado.
        </h2>
        <div className="mx-auto mt-12 grid max-w-xl gap-2.5 text-left">
          {[
            ["Postear más en Insta", "ruido, no clientes."],
            ["Pedir más referidos", "más clientes ratilla."],
            ["“Tira unos ads”", "quemas pasta sin oferta detrás."],
            ["Contratar un junior", "ejecutas más de lo que no vende."],
          ].map(([bad, why]) => (
            <div
              key={bad}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <span className="text-sm text-foreground/40 line-through">{bad}</span>
              <span className="text-right text-sm text-foreground/70">→ {why}</span>
            </div>
          ))}
        </div>
        <p className="mt-12 font-display text-2xl font-black uppercase leading-tight sm:text-3xl">
          No tienes un problema de marketing.
          <br />
          Tienes un problema de <span className="glow">sistema</span>.
        </p>
      </Shell>
    ),
  },
  // 5 ── El mecanismo (el puente)
  {
    id: "mecanismo",
    label: "El mecanismo",
    render: () => (
      <Shell>
        <Eyebrow>El mecanismo</Eyebrow>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          Te montamos la máquina.
          <br />
          Y te damos las <span className="glow">llaves</span>.
        </h2>
        <div className="mx-auto mt-7 flex max-w-md flex-col items-stretch gap-1.5">
          {[
            ["Oferta", "que nadie regatea"],
            ["ICP", "a quién, dónde, con qué mensaje"],
            ["Anuncios", "que traen al cliente correcto"],
            ["CRM + Embudo", "conectados, nada se cae"],
            ["Tu VSL", "vende por ti mientras duermes"],
          ].map(([piece, desc], i, arr) => (
            <div key={piece} className="relative">
              <SpotlightCard padded={false} className="flex items-center gap-4 px-5 py-2">
                <span className="w-6 font-display text-lg font-black text-foreground/30">{i + 1}</span>
                <div className="text-left">
                  <div className="text-sm font-semibold">{piece}</div>
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
        <p className="mx-auto mt-7 max-w-2xl font-display text-xl font-black uppercase leading-tight sm:text-2xl">
          No tácticas sueltas. El sistema entero. <span className="glow">Done-For-You</span>.
        </p>
      </Shell>
    ),
  },
  // 6 ── ★ ROADMAP REAL
  {
    id: "roadmap",
    label: "El Ascenso",
    render: () => (
      <Shell>
        <Eyebrow>El Ascenso · tu calendario real</Eyebrow>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          De rezar a <span className="glow">predecir</span>.
        </h2>
        <div className="mt-12">
          <AscensoRoadmap />
        </div>
      </Shell>
    ),
  },
  // 7 ── Tu vida después (future pacing)
  {
    id: "despues",
    label: "Tu vida después",
    render: () => (
      <Shell>
        <Eyebrow>Cómo se siente al otro lado</Eyebrow>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          El día 1 de cada mes
          <br />
          sabes, <span className="glow">con número</span>, cuánto vas a facturar.
        </h2>
        <div className="mx-auto mt-12 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
          {[
            "Entran llamadas de gente que no te conocía de nada.",
            "Tu VSL vende por ti antes de que cojas el teléfono.",
            "Dejas de regatear. Pones precio y lo defiendes.",
          ].map((t) => (
            <div key={t} className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-foreground/75">
              {t}
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-foreground/50">No ejecutan mejor que tú. Solo dejaron de vender a ciegas.</p>
      </Shell>
    ),
  },
  // 8 ── Casos
  {
    id: "casos",
    label: "Los Ascendidos",
    render: () => (
      <Shell>
        <Eyebrow>Los Ascendidos · casos reales</Eyebrow>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          No es teoría.
          <br />
          Ya está <span className="glow">pasando</span>.
        </h2>
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
          {ASCENDIDOS.map((a) => (
            <SpotlightCard key={a.name} className="text-left">
              <div className="text-[11px] uppercase tracking-wide text-foreground/45">{a.name}</div>
              <div className="text-xs text-foreground/40">{a.role}</div>
              <div className="mt-4 font-display text-4xl font-black glow">{a.result}</div>
              <div className="mt-2 text-sm leading-snug text-foreground/65">{a.context}</div>
            </SpotlightCard>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-xl text-[11px] italic text-foreground/35">
          Casos reales de clientes del Círculo. Ilustrativos: no garantizamos una cifra concreta — depende de tu caso y
          tu ejecución.
        </p>
      </Shell>
    ),
  },
  // 9 ── La inversión
  {
    id: "inversion",
    label: "La inversión",
    render: ({ config }) => {
      const priceLabel = config?.totalCents ? fmtMoney(config.totalCents, config.currency) : "€10.000";
      const planLabel = config?.plan
        ? `o ${config.plan.installments} plazos de ${fmtMoney(config.plan.installmentCents, config.currency)}`
        : null;
      return (
        <Shell>
          <Eyebrow>Hagamos números de verdad</Eyebrow>
          <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
            La cuenta que lo deja claro.
          </h2>
          <div className="mx-auto mt-12 max-w-lg space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-5 py-4">
              <span className="text-left text-sm text-foreground/60">
                No actuar un año
                <br />
                <span className="text-xs text-foreground/40">la hemorragia</span>
              </span>
              <span className="font-display text-2xl font-black text-red-500/80">−€120.000</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-5 py-4">
              <span className="text-left text-sm text-foreground/60">
                Montarlo tú en casa
                <br />
                <span className="text-xs text-foreground/40">contratar + tools + 12 meses</span>
              </span>
              <span className="font-display text-2xl font-black text-foreground/55">≈ €45.000</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/[0.04] px-5 py-5 shadow-glow-md">
              <span className="text-left text-sm text-foreground">
                Tu inversión en El Ascenso
                {planLabel && <span className="mt-0.5 block text-xs text-foreground/45">{planLabel}</span>}
              </span>
              <span className="font-display text-4xl font-black glow">{priceLabel}</span>
            </div>
          </div>
          <p className="mt-10 font-display text-xl font-black uppercase sm:text-2xl">
            Se paga con el primer cliente.
            <br />O con los dos primeros.
          </p>
        </Shell>
      );
    },
  },
  // 10 ── El poder de decidir (cierre + CTA)
  {
    id: "decidir",
    label: "Decidir",
    render: ({ goOnboarding }) => (
      <Shell>
        <Eyebrow>El compromiso</Eyebrow>
        <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          Dos caminos
          <br />
          salen de esta llamada.
        </h2>
        <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-foreground/55">
            <div className="mb-2 text-xs uppercase tracking-wide">El de</div>
            <div className="font-display text-xl font-black uppercase leading-tight">
              Seguir rezando
              <br />
              cada día 1.
            </div>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/[0.04] p-6 shadow-glow-md">
            <div className="mb-2 text-xs uppercase tracking-wide text-foreground/60">El de</div>
            <div className="font-display text-xl font-black uppercase leading-tight glow">
              Montar la máquina
              <br />
              y dejar la suerte.
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 grid max-w-xl gap-2 text-left">
          {[
            "Trabajamos por fases con hitos. Ves la máquina montarse pieza a pieza.",
            "DFY de verdad: lo hace mi equipo, no una plantilla por email.",
            "Montamos pocos al mes. Cada uno lo hacemos a mano.",
          ].map((t) => (
            <div key={t} className="flex items-start gap-3 text-sm text-foreground/70">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
              <span>{t}</span>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <MagneticButton
            variant="default"
            size="xl"
            onClick={goOnboarding}
            className="max-w-[90vw] animate-glow-pulse-intense whitespace-normal text-center leading-tight"
          >
            Reservar plaza y arrancar el onboarding <ArrowRight className="h-5 w-5" />
          </MagneticButton>
        </div>
      </Shell>
    ),
  },
];

export const PitchDeck = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { data: config } = useConsultingConfig();
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const touchX = useRef<number | null>(null);

  const last = SLIDES.length - 1;
  const go = useCallback(
    (to: number) => {
      const clamped = Math.max(0, Math.min(last, to));
      setDir(clamped >= slide ? 1 : -1);
      setSlide(clamped);
    },
    [slide, last]
  );
  const next = useCallback(() => go(slide + 1), [go, slide]);
  const prev = useCallback(() => go(slide - 1), [go, slide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(last);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, last]);

  const ctx: Ctx = { config, goOnboarding: () => navigate("/consultoria/onboarding") };

  const variants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (d: number) => ({ opacity: 0, x: d > 0 ? 48 : -48, filter: "blur(6px)" }),
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: (d: number) => ({ opacity: 0, x: d > 0 ? -48 : 48, filter: "blur(6px)" }),
      };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden text-foreground"
      style={{ background: "hsl(0 0% 5%)" }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -50) next();
        else if (dx > 50) prev();
        touchX.current = null;
      }}
    >
      {/* Rail de progreso */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center gap-1.5 px-4 py-3 sm:gap-2 sm:px-6">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            className="group flex-1"
            aria-label={s.label}
            title={s.label}
          >
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                i === slide ? "bg-white" : i < slide ? "bg-white/40" : "bg-white/12"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="absolute left-1/2 top-6 z-30 -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-foreground/35">
        {SLIDES[slide].label} · {slide + 1}/{SLIDES.length}
      </div>

      {/* Zonas de click (bordes) */}
      <button
        aria-label="Anterior"
        onClick={prev}
        disabled={slide === 0}
        className="absolute left-0 top-16 bottom-0 z-20 w-[10%] cursor-w-resize disabled:cursor-default"
      />
      <button
        aria-label="Siguiente"
        onClick={next}
        disabled={slide === last}
        className="absolute right-0 top-16 bottom-0 z-20 w-[10%] cursor-e-resize disabled:cursor-default"
      />

      {/* Slide actual */}
      <div className="h-full overflow-y-auto">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={SLIDES[slide].id}
            custom={dir}
            variants={variants as any}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.45, ease: EASE }}
            className="min-h-full"
          >
            {SLIDES[slide].render(ctx)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flechas */}
      {slide > 0 && (
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/40 p-2 text-foreground/60 transition hover:text-foreground sm:block"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {slide < last && (
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/40 p-2 text-foreground/60 transition hover:text-foreground sm:block"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
