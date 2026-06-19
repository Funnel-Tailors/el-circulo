// Datos del deck de venta /consultoria.
import { CONSULTORIA_ROADMAP, type RoadmapPhase } from "@/data/consultoriaRoadmap";

// ── Casos reales (Ascendidos del DFY). Números reales; marco ilustrativo. ──
export interface Ascendido {
  name: string;
  role: string;
  result: string;   // el número, grande
  context: string;  // la frase, pequeña
}

export const ASCENDIDOS: Ascendido[] = [
  {
    name: "Memorable",
    role: "Estudio creativo",
    result: "+€82.000",
    context: "en pipeline en sus primeros 30 días con el sistema montado.",
  },
  {
    name: "Vitini",
    role: "Estudio de contenido",
    result: "×3",
    context: "su facturación por cliente — misma capacidad, oferta reposicionada.",
  },
  {
    name: "Bruno · thisisbrv",
    role: "Agencia",
    result: "7 clientes",
    context: "pagando más por trabajar menos. Misma oferta, otra forma de decirla.",
  },
];

// ── Roadmap con fechas reales desde HOY ──
// Offset en días por fase (el campo `weeks` del roadmap es una ventana textual).
const PHASE_DAY: Record<string, number> = {
  kickoff: 0,
  oferta: 7,
  captacion: 21,
  embudo: 42,
  ventas: 63,
  cierre: 84,
};

export interface DatedPhase {
  phase: RoadmapPhase;
  date: Date | null;   // null = "según caso" (rebranding opcional)
  dateLabel: string;
}

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function fmtDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

// Devuelve las fases con su fecha real calculada desde `start` (por defecto, hoy).
export function datedRoadmap(start: Date): DatedPhase[] {
  return CONSULTORIA_ROADMAP.map((phase) => {
    const offset = PHASE_DAY[phase.key];
    if (offset === undefined) {
      return { phase, date: null, dateLabel: "según caso" };
    }
    const date = addDays(start, offset);
    return { phase, date, dateLabel: fmtDate(date) };
  });
}

// Hito temprano estrella: primeros anuncios LIVE a las ~72h.
export function firstAdsDate(start: Date): { date: Date; label: string } {
  const date = addDays(start, 3);
  return { date, label: fmtDate(date) };
}
