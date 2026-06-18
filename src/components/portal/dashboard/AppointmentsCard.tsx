// ============================================================================
// APPOINTMENTS CARD — El Círculo Service Delivery Dashboard
// Small premium card: citas agendadas / upcoming
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Calendar } from "lucide-react";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium/EnergyCard";
import type { DashboardMetrics } from "./types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── AppointmentsCard ─────────────────────────────────────────────────────────
interface AppointmentsCardProps {
  appointments: NonNullable<DashboardMetrics["appointments"]>;
}

export const AppointmentsCard: React.FC<AppointmentsCardProps> = ({ appointments }) => {
  const { upcoming, total } = appointments;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.38, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <EnergyCard
        beamSpeed={5}
        beamIntensity={0.4}
        enableTilt={false}
        className="h-full"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        <EnergyCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-white/40">
              Calendario
            </p>
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-white/60" />
            </div>
          </div>
          <h3 className="font-display font-black text-base text-white uppercase tracking-tight mt-2">
            Citas
          </h3>
        </EnergyCardHeader>

        <EnergyCardContent className="pt-0">
          {/* Upcoming — primary metric */}
          <div className="mb-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Próximas</p>
            <p
              className="glow font-display font-black text-5xl text-white tracking-tight leading-none"
              style={{ fontWeight: 900 }}
            >
              {upcoming}
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/6 mb-4" />

          {/* Total — secondary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-white/30" />
              <p className="text-xs text-white/40">Total históricas</p>
            </div>
            <p className="text-sm font-semibold text-white/70">{total}</p>
          </div>
        </EnergyCardContent>
      </EnergyCard>
    </motion.div>
  );
};

export default AppointmentsCard;
