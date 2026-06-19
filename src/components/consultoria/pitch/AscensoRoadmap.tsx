import { motion, useReducedMotion } from "framer-motion";
import { CONSULTORIA_ROADMAP } from "@/data/consultoriaRoadmap";
import { datedRoadmap, firstAdsDate } from "./data";

// Roadmap "El Ascenso" con FECHAS REALES desde hoy. El plato fuerte del deck:
// la value equation hecha visual (probabilidad ↑, tiempo y esfuerzo ↓).
const EASE = [0.16, 1, 0.3, 1] as const;
const SPRING = [0.34, 1.56, 0.64, 1] as const;

// Timing maestro: el haz tarda en llenarse y los nodos van "encendiéndose"
// a medida que la energía pasa por ellos (left→right).
const BEAM_DELAY = 0.45;
const BEAM_DURATION = 2.1;

export const AscensoRoadmap = ({ start }: { start?: Date }) => {
  const reduce = useReducedMotion();
  const today = start ?? new Date();
  const phases = datedRoadmap(today).filter((p) => p.phase.key !== "rebranding");
  const rebranding = CONSULTORIA_ROADMAP.find((p) => p.key === "rebranding");
  const ads = firstAdsDate(today);
  const n = phases.length;

  // Cada nodo se enciende cuando el "cometa" del haz lo cruza.
  const nodeAt = (i: number) => BEAM_DELAY + (BEAM_DURATION * (i + 0.5)) / n;

  return (
    <div className="w-full">
      {/* Hito estrella: +72h — entra cinematográfico, late con vida */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.94, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto mb-12 w-fit max-w-md"
      >
        {/* Halo respirando detrás del callout */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-3 rounded-[1.6rem]"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 50%, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%)",
            }}
            animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.97, 1.03, 0.97] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="relative rounded-2xl border border-white/25 bg-white/[0.04] px-6 py-3 text-center shadow-glow-md">
          <motion.div
            animate={reduce ? {} : { opacity: [0.88, 1, 0.88] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-foreground/50">En ~72 horas</div>
            <div className="mt-1 font-display font-black uppercase text-base sm:text-lg leading-tight">
              <span className="glow">{ads.label}</span> · primeros anuncios <span className="glow">LIVE</span>{" "}
              <motion.span
                className="inline-block"
                animate={reduce ? {} : { rotate: [0, -12, 12, -8, 0], scale: [1, 1.18, 1.05, 1.12, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
              >
                ⚡
              </motion.span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* DESKTOP — timeline horizontal (necesita ancho; <1024px usa el vertical) */}
      <div className="relative mt-2 hidden lg:block">
        {/* Riel base */}
        <div className="absolute left-0 right-0 top-[64px] h-px bg-white/10" />

        {/* Haz que se llena: energía fluyendo izquierda→derecha */}
        <motion.div
          className="absolute left-0 top-[64px] h-px origin-left bg-gradient-to-r from-white/30 via-white/70 to-white"
          style={{ boxShadow: "0 0 12px rgba(255,255,255,0.45)" }}
          initial={{ width: reduce ? "100%" : 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: reduce ? 0 : BEAM_DURATION, ease: EASE, delay: reduce ? 0 : BEAM_DELAY }}
        />

        {/* Cometa: pulso brillante que viaja por delante del relleno */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute top-[64px] z-10 h-px"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: BEAM_DURATION, ease: EASE, delay: BEAM_DELAY }}
          >
            <div
              className="absolute -top-[7px] h-[15px] w-[15px] -translate-x-1/2 rounded-full bg-white"
              style={{ boxShadow: "0 0 18px 4px rgba(255,255,255,0.9), 0 0 40px 10px rgba(255,255,255,0.4)" }}
            />
            {/* estela */}
            <div
              className="absolute -top-px h-px w-24 -translate-x-full"
              style={{ background: "linear-gradient(to left, rgba(255,255,255,0.9), rgba(255,255,255,0))" }}
            />
          </motion.div>
        )}

        {/* Shimmer sutil recorriendo el haz una vez asentado */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-[64px] h-px overflow-hidden"
          >
            <motion.div
              className="absolute top-0 h-px w-40"
              style={{ background: "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))" }}
              initial={{ left: "-20%" }}
              animate={{ left: ["-20%", "120%"] }}
              transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut", delay: BEAM_DELAY + BEAM_DURATION }}
            />
          </motion.div>
        )}

        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
          {phases.map((p, i) => (
            <div key={p.phase.key} className="flex flex-col items-center px-2 text-center">
              {/* Fecha: cuenta-desliza cuando el cometa cruza el nodo */}
              <motion.div
                className="mb-3 h-4 font-mono text-[11px] text-foreground/55"
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: -6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : nodeAt(i) - 0.05 }}
              >
                {p.dateLabel}
              </motion.div>

              {/* Nodo: bloom de escala + glow cuando lo alcanza la energía */}
              <motion.div
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black text-base"
                initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: reduce ? 0.3 : 0.7,
                  ease: reduce ? EASE : SPRING,
                  delay: reduce ? i * 0.05 : nodeAt(i),
                }}
                style={{ boxShadow: "0 0 14px rgba(255,255,255,0.22)" }}
              >
                {/* anillo que se expande al encenderse */}
                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-white"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 0.7, 0], scale: [0.6, 2.1, 2.4] }}
                    transition={{ duration: 1.1, ease: EASE, delay: nodeAt(i) }}
                  />
                )}
                {/* la runa "se asienta" con un micro pop */}
                <motion.span
                  className="relative"
                  initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.3, rotate: -25 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, ease: SPRING, delay: reduce ? 0 : nodeAt(i) + 0.12 }}
                >
                  {p.phase.rune}
                </motion.span>
              </motion.div>

              {/* Texto del nodo, en cascada tras el encendido */}
              <motion.div
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0.1 + i * 0.05 : nodeAt(i) + 0.18 }}
              >
                <div className="mt-4 text-[10px] uppercase tracking-[0.15em] text-foreground/40">{p.phase.weeks}</div>
                <div className="mt-1 font-display text-sm font-black uppercase leading-tight">{p.phase.phase}</div>
                <div className="mt-1.5 text-[11px] leading-snug text-foreground/55">{p.phase.tagline}</div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE/TABLET — timeline vertical */}
      <div className="mt-4 lg:hidden">
        {phases.map((p, i) => {
          const d = reduce ? 0.1 + i * 0.06 : BEAM_DELAY + i * 0.18;
          return (
            <motion.div
              key={p.phase.key}
              className="flex gap-4"
              initial={{ opacity: reduce ? 1 : 0, x: reduce ? 0 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: d }}
            >
              <div className="flex flex-col items-center">
                <motion.div
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black text-sm"
                  initial={reduce ? { opacity: 1 } : { scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduce ? 0.3 : 0.6, ease: reduce ? EASE : SPRING, delay: d }}
                  style={{ boxShadow: "0 0 12px rgba(255,255,255,0.2)" }}
                >
                  {!reduce && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-full border border-white"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: [0, 0.6, 0], scale: [0.6, 1.9, 2.2] }}
                      transition={{ duration: 1, ease: EASE, delay: d + 0.05 }}
                    />
                  )}
                  {p.phase.rune}
                </motion.div>
                {i < n - 1 && (
                  <motion.div
                    className="my-1 w-px flex-1 origin-top bg-white/15"
                    style={{ minHeight: 30 }}
                    initial={{ scaleY: reduce ? 1 : 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, ease: EASE, delay: d + 0.15 }}
                  />
                )}
              </div>
              <div className="pb-5 text-left">
                <div className="font-mono text-[11px] text-foreground/55">{p.dateLabel}</div>
                <div className="mt-0.5 font-display text-sm font-black uppercase leading-tight">{p.phase.phase}</div>
                <div className="mt-0.5 text-[11px] text-foreground/55">{p.phase.tagline}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rebranding opcional */}
      {rebranding && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0.4 : BEAM_DELAY + BEAM_DURATION }}
        >
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-foreground/40">
            {rebranding.rune} {rebranding.phase} · {rebranding.title} — según caso
          </span>
        </motion.div>
      )}

      <motion.p
        className="mx-auto mt-8 max-w-2xl text-center text-sm text-foreground/70"
        initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: reduce ? 0.5 : BEAM_DELAY + BEAM_DURATION + 0.15 }}
      >
        Si arrancamos <span className="text-foreground">hoy</span>, el <span className="glow">{ads.label}</span> tus primeros
        anuncios ya corren. En <span className="text-foreground">12 semanas</span> la máquina está afinada y rodando.
      </motion.p>
    </div>
  );
};
