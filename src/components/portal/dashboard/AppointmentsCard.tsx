// ============================================================================
// APPOINTMENTS CARD — El Círculo Service Delivery Dashboard
// Compact 1/3-width tile: upcoming + total citas, premium cockpit feel
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Calendar, Clock } from "lucide-react";
import { EnergyCard, EnergyCardContent } from "@/components/premium/EnergyCard";
import type { DashboardMetrics } from "./types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── AppointmentsCard ─────────────────────────────────────────────────────────
interface AppointmentsCardProps {
  appointments: DashboardMetrics["appointments"];
}

export const AppointmentsCard: React.FC<AppointmentsCardProps> = ({ appointments }) => {
  // Sin datos de calendario (el token GHL no expone citas) → estado elegante.
  if (!appointments) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.36, ease: EASE_OUT_EXPO }}
        className="h-full"
      >
        <EnergyCard beamSpeed={5} beamIntensity={0.3} enableTilt={false} className="h-full flex flex-col" style={{ background: "rgba(0,0,0,0.5)" }}>
          <EnergyCardContent className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-1">Calendario</p>
                <h3 className="font-display font-black text-base text-white uppercase tracking-tight leading-none">Citas</h3>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <CalendarCheck className="w-3.5 h-3.5 text-white/50" />
              </div>
            </div>
            <div className="w-full h-px bg-white/[0.05] mb-4" />
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2.5 py-4">
              <Calendar className="w-6 h-6 text-white/15" />
              <p className="text-xs text-white/40 leading-relaxed max-w-[180px]">Cuando se conecte tu calendario, verás aquí tus citas agendadas.</p>
            </div>
          </EnergyCardContent>
        </EnergyCard>
      </motion.div>
    );
  }

  const { upcoming, total } = appointments;

  // Conversion rate: upcoming out of total (capped at 100%)
  const convRate = total > 0 ? Math.min(Math.round((upcoming / total) * 100), 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.36, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <EnergyCard
        beamSpeed={5}
        beamIntensity={0.38}
        enableTilt={false}
        className="h-full flex flex-col"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <EnergyCardContent className="p-5 flex flex-col gap-0 h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-1">
                Calendario
              </p>
              <h3 className="font-display font-black text-base text-white uppercase tracking-tight leading-none">
                Citas
              </h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CalendarCheck className="w-3.5 h-3.5 text-white/50" />
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/[0.05] mb-4" />

          {/* Primary metric: Upcoming */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <p
                className="glow font-display font-black text-white tracking-tight leading-none"
                style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 900 }}
              >
                {upcoming}
              </p>
              <div className="flex items-center gap-1 pb-1">
                <Clock className="w-3 h-3 text-white/30" />
                <p className="text-[10px] text-white/30 uppercase tracking-widest">próximas</p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="w-full h-px bg-white/[0.05] mb-4" />

          {/* Secondary stats row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Históricas</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-white/30" />
                <p className="text-sm font-semibold text-white/65">{total}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Activas</p>
              <p className="text-sm font-semibold text-white/65">{convRate}%</p>
            </div>
          </div>

          {/* Progress bar: upcoming / total */}
          {total > 0 && (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-white/25 uppercase tracking-widest">Ratio activas</p>
                <p className="text-[10px] text-white/35">{upcoming} / {total}</p>
              </div>
              <div
                className="w-full h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "rgba(255,255,255,0.55)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${convRate}%` }}
                  transition={{ duration: 1, delay: 0.6, ease: EASE_OUT_EXPO }}
                />
              </div>
            </div>
          )}
        </EnergyCardContent>
      </EnergyCard>
    </motion.div>
  );
};

export default AppointmentsCard;
