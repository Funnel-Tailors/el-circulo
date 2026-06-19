// ============================================================================
// APPOINTMENTS CARD — El Círculo Service Delivery Dashboard
// Compact tile: upcoming + total citas · above-the-fold density
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Calendar, Clock } from "lucide-react";
import { EnergyCard, EnergyCardContent } from "@/components/premium/EnergyCard";
import { BorderBeam } from "./BorderBeam";
import type { DashboardMetrics } from "./types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface AppointmentsCardProps {
  appointments: DashboardMetrics["appointments"];
}

export const AppointmentsCard: React.FC<AppointmentsCardProps> = ({ appointments }) => {
  // No calendar data — elegant empty state
  if (!appointments) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.36, ease: EASE_OUT_EXPO }}
        className="group relative h-full"
      >
        <EnergyCard
          beamSpeed={5}
          beamIntensity={0.3}
          enableTilt={false}
          className="h-full flex flex-col"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <EnergyCardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-0.5">Calendario</p>
                <h3 className="font-display font-black text-sm text-white uppercase tracking-tight leading-none">Citas</h3>
              </div>
              <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <CalendarCheck className="w-3 h-3 text-white/50" />
              </div>
            </div>
            <div className="w-full h-px bg-white/[0.05] mb-3" />
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-2">
              <Calendar className="w-5 h-5 text-white/15" />
              <p className="text-[10px] text-white/38 leading-relaxed max-w-[160px]">
                Cuando se conecte tu calendario, verás aquí tus citas agendadas.
              </p>
            </div>
          </EnergyCardContent>
        </EnergyCard>
        <BorderBeam duration={4.2} />
      </motion.div>
    );
  }

  const { upcoming, total } = appointments;
  const convRate = total > 0 ? Math.min(Math.round((upcoming / total) * 100), 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.36, ease: EASE_OUT_EXPO }}
      className="group relative h-full"
    >
      <EnergyCard
        beamSpeed={5}
        beamIntensity={0.38}
        enableTilt={false}
        className="h-full flex flex-col"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <EnergyCardContent className="p-4 flex flex-col gap-0 h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-0.5">
                Calendario
              </p>
              <h3 className="font-display font-black text-sm text-white uppercase tracking-tight leading-none">
                Citas
              </h3>
            </div>
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CalendarCheck className="w-3 h-3 text-white/50" />
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/[0.05] mb-3" />

          {/* Primary metric: Upcoming */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <p
                className="glow font-display font-black text-white tracking-tight leading-none"
                style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 900 }}
              >
                {upcoming}
              </p>
              <div className="flex items-center gap-1 pb-0.5">
                <Clock className="w-2.5 h-2.5 text-white/30" />
                <p className="text-[9px] text-white/30 uppercase tracking-widest">próximas</p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="w-full h-px bg-white/[0.05] mb-3" />

          {/* Secondary stats row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] text-white/28 uppercase tracking-widest mb-0.5">Históricas</p>
              <div className="flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 text-white/28" />
                <p className="text-xs font-semibold text-white/60">{total}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/28 uppercase tracking-widest mb-0.5">Activas</p>
              <p className="text-xs font-semibold text-white/60">{convRate}%</p>
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] text-white/22 uppercase tracking-widest">Ratio activas</p>
                <p className="text-[9px] text-white/32">{upcoming} / {total}</p>
              </div>
              <div
                className="w-full h-0.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "rgba(255,255,255,0.5)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${convRate}%` }}
                  transition={{ duration: 0.9, delay: 0.6, ease: EASE_OUT_EXPO }}
                />
              </div>
            </div>
          )}
        </EnergyCardContent>
      </EnergyCard>
      <BorderBeam duration={4.2} />
    </motion.div>
  );
};

export default AppointmentsCard;
