// ============================================================================
// PROJECT TIMELINE — El Círculo Service Delivery Dashboard
// Fancy animated horizontal beam · milestone nodes · pulsing ring
// 14 hitos con phase grouping · carbon/white/glow · framer-motion
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Milestone } from "@/components/portal/ProjectRoadmap";
import { SpotlightCard } from "@/components/premium/SpotlightCard";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Phase label segmentation ────────────────────────────────────────────────
// Groups milestones by phase_label for subtle visual dividers
function getPhaseGroups(milestones: Milestone[]) {
  const groups: { label: string; start: number; end: number }[] = [];
  let i = 0;
  while (i < milestones.length) {
    const label = milestones[i].phase_label;
    let j = i;
    while (j < milestones.length && milestones[j].phase_label === label) j++;
    groups.push({ label, start: i, end: j - 1 });
    i = j;
  }
  return groups;
}

// ─── Milestone node ───────────────────────────────────────────────────────────
interface MilestoneNodeProps {
  milestone: Milestone;
  index: number;
  isCurrent: boolean;
  isPast: boolean;
  isDone: boolean;
  isBlocked: boolean;
  totalCount: number;
}

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  milestone,
  isCurrent,
  isPast,
  isDone,
  isBlocked,
}) => {
  const prefersReduced = useReducedMotion();
  const [tooltip, setTooltip] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
    >
      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
          className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{
            background: "rgba(0,0,0,0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            padding: "4px 10px",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
          }}
        >
          <span className="text-[10px] text-white/85 font-medium tracking-wide">
            {milestone.title}
          </span>
        </motion.div>
      )}

      {/* Pulsing outer ring for current milestone */}
      {isCurrent && !prefersReduced && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 20,
            height: 20,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            border: "1.5px solid rgba(255,255,255,0.5)",
          }}
          animate={{
            scale: [1, 1.7, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Second ring for extra glow on current */}
      {isCurrent && !prefersReduced && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 26,
            height: 26,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
      )}

      {/* Node dot */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        className="relative z-10 rounded-full flex-shrink-0"
        style={{
          width: isCurrent ? 11 : 7,
          height: isCurrent ? 11 : 7,
          background: isBlocked
            ? "rgba(251,191,36,0.8)"
            : isDone
            ? "rgba(255,255,255,0.95)"
            : isCurrent
            ? "rgba(255,255,255,1)"
            : "rgba(255,255,255,0.12)",
          border: isCurrent
            ? "2px solid rgba(255,255,255,0.95)"
            : isDone
            ? "1.5px solid rgba(255,255,255,0.6)"
            : isBlocked
            ? "1.5px solid rgba(251,191,36,0.5)"
            : "1.5px solid rgba(255,255,255,0.2)",
          boxShadow: isCurrent
            ? "0 0 0 3px rgba(255,255,255,0.12), 0 0 12px rgba(255,255,255,0.4)"
            : isDone
            ? "0 0 6px rgba(255,255,255,0.25)"
            : "none",
          transition: "width 0.2s, height 0.2s",
        }}
      />
    </div>
  );
};

// ─── ProjectTimeline ─────────────────────────────────────────────────────────
interface ProjectTimelineProps {
  milestones: Milestone[];
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ milestones }) => {
  const prefersReduced = useReducedMotion();
  const beamRef = useRef<HTMLDivElement>(null);

  const total = milestones.length;
  const done = milestones.filter((m) => m.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const currentIdx = milestones.findIndex((m) => m.status === "in_progress");
  const current =
    currentIdx >= 0
      ? milestones[currentIdx]
      : milestones.find((m) => m.status !== "done");

  const phaseGroups = getPhaseGroups(milestones);

  // Animate beam width on mount
  const [beamWidth, setBeamWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setBeamWidth(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  if (!milestones.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
    >
      <SpotlightCard
        padded={false}
        className="px-5 pt-3.5 pb-4"
        style={{ background: "rgba(0,0,0,0.55)" }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
            El Ascenso
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/50">
            {current && (
              <>
                <span className="text-white/40">Ahora:</span>
                <span className="text-white/85 font-medium truncate max-w-[180px]">
                  {current.title}
                </span>
                <span className="text-white/20">·</span>
              </>
            )}
            <span
              className="glow font-display font-black text-white text-xs"
              style={{ letterSpacing: "-0.01em" }}
            >
              {pct}%
            </span>
          </div>
        </div>

        {/* Phase labels row — hidden on mobile where space is too tight */}
        <div className="relative mb-1.5 hidden sm:block">
          <div className="flex w-full">
            {phaseGroups.map((g) => {
              const widthPct = ((g.end - g.start + 1) / total) * 100;
              return (
                <div
                  key={g.label}
                  style={{ width: `${widthPct}%` }}
                  className="flex items-center overflow-hidden"
                >
                  <span className="text-[9px] uppercase tracking-[0.12em] text-white/20 font-medium truncate pr-1">
                    {g.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline track */}
        <div className="relative" style={{ height: 28 }}>
          {/* Background track */}
          <div
            className="absolute left-0 right-0 rounded-full"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              height: 2,
              background: "rgba(255,255,255,0.07)",
            }}
          />

          {/* Glowing beam fill — animates left→right */}
          <div
            ref={beamRef}
            className="absolute left-0 rounded-full overflow-hidden"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              height: 2,
              width: prefersReduced ? `${pct}%` : "0%",
              transition: prefersReduced
                ? "none"
                : `width 1.4s cubic-bezier(${EASE_OUT_EXPO.join(",")})`,
            }}
          >
            {/* We animate via state-driven width */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.85) 100%)",
                boxShadow: "0 0 8px 1px rgba(255,255,255,0.3)",
              }}
            />
          </div>

          {/* Animated beam via motion */}
          <motion.div
            className="absolute left-0 rounded-full"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              height: 2,
              background:
                "linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.9) 100%)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.25), 0 0 2px rgba(255,255,255,0.6)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: prefersReduced ? `${pct}%` : `${beamWidth}%` }}
            transition={{
              duration: prefersReduced ? 0 : 1.4,
              ease: EASE_OUT_EXPO,
              delay: 0.2,
            }}
          />

          {/* Milestone nodes */}
          <div className="absolute inset-0 flex items-center">
            {milestones.map((m, i) => {
              const isCurrent =
                i === currentIdx ||
                (currentIdx < 0 && m === current);
              const isDone = m.status === "done";
              const isBlocked = m.status === "blocked";
              const isPast = isDone && i < currentIdx;
              // Position each node evenly
              const leftPct = total > 1 ? (i / (total - 1)) * 100 : 50;

              return (
                <div
                  key={m.id}
                  className="absolute"
                  style={{
                    left: `${leftPct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <MilestoneNode
                    milestone={m}
                    index={i}
                    isCurrent={isCurrent}
                    isPast={isPast}
                    isDone={isDone}
                    isBlocked={isBlocked}
                    totalCount={total}
                  />
                </div>
              );
            })}
          </div>

          {/* Phase dividers — subtle vertical ticks between phases */}
          {phaseGroups.slice(0, -1).map((g) => {
            // Divider after last milestone of each phase (except last)
            const dividerIdx = g.end;
            const leftPct =
              total > 1 ? ((dividerIdx + 0.5) / (total - 1)) * 100 : 50;
            return (
              <div
                key={`div-${g.label}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${leftPct}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 1,
                  height: 10,
                  background: "rgba(255,255,255,0.08)",
                }}
              />
            );
          })}
        </div>

        {/* Phase labels below — only at phase boundaries, hidden on mobile */}
        <div className="relative mt-1.5 hidden sm:block" style={{ height: 12 }}>
          {phaseGroups.map((g) => {
            const midIdx = g.start + Math.floor((g.end - g.start) / 2);
            const leftPct = total > 1 ? (midIdx / (total - 1)) * 100 : 50;
            const doneInPhase = milestones.slice(g.start, g.end + 1).filter((m) => m.status === "done").length;
            const totalInPhase = g.end - g.start + 1;
            const isPhaseComplete = doneInPhase === totalInPhase;
            const hasCurrentInPhase = milestones.slice(g.start, g.end + 1).some((m) => m.status === "in_progress");

            return (
              <div
                key={`label-${g.label}`}
                className="absolute text-center"
                style={{
                  left: `${leftPct}%`,
                  transform: "translateX(-50%)",
                  top: 0,
                }}
              >
                <span
                  className="text-[9px] uppercase tracking-[0.1em] font-medium whitespace-nowrap"
                  style={{
                    color: isPhaseComplete
                      ? "rgba(255,255,255,0.45)"
                      : hasCurrentInPhase
                      ? "rgba(255,255,255,0.65)"
                      : "rgba(255,255,255,0.2)",
                  }}
                >
                  {g.label}
                </span>
              </div>
            );
          })}
        </div>
      </SpotlightCard>
    </motion.div>
  );
};

export default ProjectTimeline;
