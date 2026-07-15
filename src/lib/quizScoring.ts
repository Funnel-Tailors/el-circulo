import type { QuizState } from "@/types/quiz";

/**
 * Fuente única del scoring del quiz.
 *
 * Antes vivía duplicado en QuizSection (la puerta) y en QualifiedResult (lo que
 * viaja a GHL), y las dos copias divergieron en el pivote de ICP: la puerta daba
 * 45 pts al que factura €20K+ y GHL lo registraba con 38. El CRM llevaba meses
 * premiando al que menos factura. No volver a duplicarlo.
 */

/** Respuestas de capacidad de inversión (q5). Deben coincidir con las opciones del quiz. */
export const CAPACITY_YES = "Sí. Si me encaja, lo asumo.";
export const CAPACITY_NO = "No. Ahora mismo no puedo.";

/** Facturación por debajo de la cual no entra nadie. Espeja el eyebrow del hero. */
const REVENUE_HARDSTOPS = ["Menos de €3.000/mes", "€3.000 - €5.000/mes"];

export const calculateQuizScore = (state: QuizState): number => {
  let score = 0;

  // Q1 — Pain point (0-15)
  if (state.q1 === "No sé cómo vender proyectos de 5 cifras sin que nos regateen") score += 15;
  else if (state.q1 === "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo") score += 15;
  else if (state.q1 === "Todo lo anterior (¿Pero de verdad se puede escalar esto?)") score += 15;
  else if (state.q1 === "Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)") score += 15;
  else if (state.q1 === "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)") score += 13;

  // Q2 — Profesión (0-15)
  if (state.q2 === "Estudio de visualización arquitectónica / arch-viz / render") score += 15;
  else if (state.q2 === "Agencia de diseño / branding") score += 15;
  else if (state.q2 === "Estudio de desarrollo / automatización") score += 15;
  else if (state.q2 === "Productora / Estudio audiovisual") score += 13;
  else if (state.q2 === "Otro tipo de agencia creativa") score += 13;

  // Q3 — Facturación (0-45) — recompensa la solvencia; nunca castiga al que factura más.
  if (state.q3 === "Más de €20.000/mes") score += 45;
  else if (state.q3 === "€10.000 - €20.000/mes") score += 45;
  else if (state.q3 === "€5.000 - €10.000/mes") score += 38;

  // Q5 — Capacidad de inversión (0-15). El "no" descalifica abajo, así que aquí solo suma el "sí".
  if (state.q5 === CAPACITY_YES) score += 15;

  // Q7 — Autoridad (0-10)
  if (state.q7?.includes("Solo yo")) score += 10;
  else if (state.q7?.includes("Con mi socio")) score += 7;

  return Math.min(score, 100);
};

export const hasAutoDisqualify = (state: QuizState, score: number): boolean => {
  // Facturación por debajo del suelo: no llega ni al DFY.
  if (state.q3 && REVENUE_HARDSTOPS.includes(state.q3)) return true;

  // Dice de frente que no puede asumir la inversión. Se le cree.
  if (state.q5 === CAPACITY_NO) return true;

  // Decisión compartida sin un perfil lo bastante fuerte como para compensarlo.
  if (state.q7?.includes("Con mi socio") && score < 80) return true;

  return false;
};

export const QUALIFY_THRESHOLD = 70;

export const isQualified = (state: QuizState, score: number): boolean =>
  score >= QUALIFY_THRESHOLD && !hasAutoDisqualify(state, score);
