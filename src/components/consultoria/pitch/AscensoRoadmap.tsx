import { motion, useReducedMotion } from "framer-motion";
import { CONSULTORIA_ROADMAP } from "@/data/consultoriaRoadmap";
import { datedRoadmap, firstAdsDate } from "./data";

// Roadmap "El Ascenso" con FECHAS REALES desde hoy. El plato fuerte del deck:
// la value equation hecha visual (probabilidad ↑, tiempo y esfuerzo ↓).
const EASE = [0.16, 1, 0.3, 1] as const;

export const AscensoRoadmap = ({ start }: { start?: Date }) => {
  const reduce = useReducedMotion();
  const today = start ?? new Date();
  const phases = datedRoadmap(today).filter((p) => p.phase.key !== "rebranding");
  const rebranding = CONSULTORIA_ROADMAP.find((p) => p.key === "rebranding");
  const ads = firstAdsDate(today);
  const n = phases.length;

  return (
    <div className="w-full">
      {/* Hito estrella: +72h */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mx-auto mb-12 w-fit max-w-md rounded-2xl border border-white/25 bg-white/[0.04] px-6 py-3 text-center shadow-glow-md"
      >
        <motion.div
          animate={reduce ? {} : { opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-foreground/50">En ~72 horas</div>
          <div className="mt-1 font-display font-black uppercase text-base sm:text-lg leading-tight">
            <span className="glow">{ads.label}</span> · primeros anuncios <span className="glow">LIVE</span> ⚡
          </div>
        </motion.div>
      </motion.div>

      {/* DESKTOP — timeline horizontal (necesita ancho; <1024px usa el vertical) */}
      <div className="relative mt-2 hidden lg:block">
        <div className="absolute left-0 right-0 top-[64px] h-px bg-white/10" />
        <motion.div
          className="absolute left-0 top-[64px] h-px bg-gradient-to-r from-white/40 to-white"
          style={{ boxShadow: "0 0 10px rgba(255,255,255,0.4)" }}
          initial={{ width: reduce ? "100%" : 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.7, ease: EASE, delay: 0.2 }}
        />
        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
          {phases.map((p, i) => (
            <motion.div
              key={p.phase.key}
              className="flex flex-col items-center px-2 text-center"
              initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.2 + i * 0.08 }}
            >
              <div className="mb-3 h-4 font-mono text-[11px] text-foreground/55">{p.dateLabel}</div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black text-base"
                style={{ boxShadow: "0 0 14px rgba(255,255,255,0.22)" }}
              >
                {p.phase.rune}
              </div>
              <div className="mt-4 text-[10px] uppercase tracking-[0.15em] text-foreground/40">{p.phase.weeks}</div>
              <div className="mt-1 font-display text-sm font-black uppercase leading-tight">{p.phase.phase}</div>
              <div className="mt-1.5 text-[11px] leading-snug text-foreground/55">{p.phase.tagline}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* MOBILE/TABLET — timeline vertical */}
      <div className="mt-4 lg:hidden">
        {phases.map((p, i) => (
          <motion.div
            key={p.phase.key}
            className="flex gap-4"
            initial={{ opacity: reduce ? 1 : 0, x: reduce ? 0 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.2 + i * 0.1 }}
          >
            <div className="flex flex-col items-center">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black text-sm"
                style={{ boxShadow: "0 0 12px rgba(255,255,255,0.2)" }}
              >
                {p.phase.rune}
              </div>
              {i < n - 1 && <div className="my-1 w-px flex-1 bg-white/15" style={{ minHeight: 30 }} />}
            </div>
            <div className="pb-5 text-left">
              <div className="font-mono text-[11px] text-foreground/55">{p.dateLabel}</div>
              <div className="mt-0.5 font-display text-sm font-black uppercase leading-tight">{p.phase.phase}</div>
              <div className="mt-0.5 text-[11px] text-foreground/55">{p.phase.tagline}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rebranding opcional */}
      {rebranding && (
        <div className="mt-8 text-center">
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-foreground/40">
            {rebranding.rune} {rebranding.phase} · {rebranding.title} — según caso
          </span>
        </div>
      )}

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-foreground/70">
        Si arrancamos <span className="text-foreground">hoy</span>, el <span className="glow">{ads.label}</span> tus primeros
        anuncios ya corren. En <span className="text-foreground">12 semanas</span> la máquina está afinada y rodando.
      </p>
    </div>
  );
};
