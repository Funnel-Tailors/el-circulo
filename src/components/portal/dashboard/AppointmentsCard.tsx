// ============================================================================
// APPOINTMENTS CARD — El Círculo Service Delivery Dashboard
// Compact tile: upcoming + total citas · above-the-fold density
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Calendar, CalendarX } from "lucide-react";
import { EnergyCard, EnergyCardContent } from "@/components/premium/EnergyCard";
import { BorderBeam } from "./BorderBeam";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "./types";
import { upcomingDayLabel, timeLabel } from "./utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

type NextAppt = NonNullable<NonNullable<DashboardMetrics["appointments"]>["next"]>[number];

// Estado GHL → etiqueta + color del pill
function statusMeta(status?: string): { label: string; dot: string; text: string } {
  const s = (status || "").toLowerCase();
  if (s === "confirmed" || s === "showed")
    return { label: "confirmada", dot: "bg-emerald-400", text: "text-emerald-400/85" };
  if (s === "cancelled" || s === "noshow" || s === "invalid")
    return { label: "cancelada", dot: "bg-white/25", text: "text-white/35" };
  return { label: "pendiente", dot: "bg-amber-400", text: "text-amber-400/85" };
}

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
  const next = appointments.next ?? [];

  // Agrupar las próximas citas por día (HOY / MAÑANA / JUE 12), manteniendo el orden ascendente.
  const groups: { label: string; items: NextAppt[] }[] = [];
  for (const appt of next) {
    const label = upcomingDayLabel(appt.start);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(appt);
    else groups.push({ label, items: [appt] });
  }

  let rowIndex = 0;

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
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-0.5">
                Calendario{upcoming > 0 && ` · ${upcoming} próxima${upcoming === 1 ? "" : "s"}`}
              </p>
              <h3 className="font-display font-black text-sm text-white uppercase tracking-tight leading-none">
                Próximas Citas
              </h3>
            </div>
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CalendarCheck className="w-3 h-3 text-white/50" />
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/[0.05] mb-1 flex-shrink-0" />

          {/* Agenda — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {next.length > 0 ? (
              <div>
                {groups.map((group) => (
                  <div key={group.label} className="pt-1.5">
                    <p className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-0.5">
                      {group.label}
                    </p>
                    {group.items.map((appt) => {
                      const meta = statusMeta(appt.status);
                      const i = rowIndex++;
                      return (
                        <motion.div
                          key={appt.id || `${appt.start}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.28, delay: 0.35 + i * 0.04, ease: EASE_OUT_EXPO }}
                          className="flex items-center gap-2.5 py-1.5 border-b border-white/[0.04] last:border-none"
                        >
                          {/* Hora */}
                          <p className="text-[11px] font-bold text-white/85 tabular-nums leading-none flex-shrink-0 w-9">
                            {timeLabel(appt.start)}
                          </p>

                          {/* Nombre */}
                          <p className="flex-1 min-w-0 text-[11px] font-medium text-white/70 truncate leading-snug">
                            {appt.name}
                          </p>

                          {/* Pill de estado */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                            <span className={cn("text-[9px] font-semibold", meta.text)}>{meta.label}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-4">
                <CalendarX className="w-5 h-5 text-white/15" />
                <p className="text-[10px] text-white/38 leading-relaxed max-w-[180px]">
                  No tienes próximas citas agendadas.
                </p>
              </div>
            )}
          </div>

          {/* Footer — total histórico, tenue */}
          {total > 0 && (
            <div className="flex items-center gap-1 pt-2 mt-1 border-t border-white/[0.05] flex-shrink-0">
              <Calendar className="w-2.5 h-2.5 text-white/25" />
              <p className="text-[9px] text-white/30 uppercase tracking-widest">{total} históricas</p>
            </div>
          )}
        </EnergyCardContent>
      </EnergyCard>
      <BorderBeam duration={4.2} />
    </motion.div>
  );
};

export default AppointmentsCard;
