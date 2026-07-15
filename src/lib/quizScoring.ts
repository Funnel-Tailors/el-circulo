import type { QuizState } from "@/types/quiz";

/**
 * Cualificación del quiz. Sin puntos.
 *
 * Hubo un scoring de 100 puntos con umbral en 70. Dejó de significar nada cuando el
 * suelo de facturación subió a €5K/mes: a partir de ahí, el mínimo que podía sacar
 * alguien que sobreviviera a los hardstops era 86 (13 dolor + 13 nicho + 38 facturación
 * + 15 capacidad + 7 autoridad). El umbral no podía fallar, las categorías B y C eran
 * inalcanzables, y el hardstop de "socio + score < 80" no disparaba jamás.
 *
 * Los hardstops hacían el 100% del trabajo, así que son lo único que queda. Si vuelve a
 * hacer falta ordenar leads, que sea con una señal que discrimine de verdad — no con
 * 2 puntos de diferencia entre "arch-viz" y "otra agencia creativa".
 */

/** Respuestas de capacidad de inversión (q5). Deben coincidir con las opciones del quiz. */
export const CAPACITY_YES = "Sí. Si me encaja, lo asumo.";
export const CAPACITY_NO = "No. Ahora mismo no puedo.";

/** Facturación por debajo de la cual no entra nadie. Espeja el eyebrow del hero. */
const REVENUE_HARDSTOPS = ["Menos de €3.000/mes", "€3.000 - €5.000/mes"];

/**
 * Facturación a la que no se le pregunta por la capacidad de inversión: si factura
 * €10K+/mes, preguntarle si puede asumir 10K le dice que le hemos confundido con otro.
 */
const CAPACITY_ASSUMED_REVENUE = ["€10.000 - €20.000/mes", "Más de €20.000/mes"];

export const skipsCapacityQuestion = (state: QuizState): boolean =>
  !!state.q3 && CAPACITY_ASSUMED_REVENUE.includes(state.q3);

/** Motivo por el que un lead no pasa, o null si pasa. El texto viaja a GHL. */
export const getDisqualifyReason = (state: QuizState): string | null => {
  if (state.q3 && REVENUE_HARDSTOPS.includes(state.q3)) {
    return "Revenue insuficiente (< €5K/mes)";
  }

  // El guard del skip protege del q5 rancio: si vuelve atrás y sube su facturación a una
  // banda que no pregunta, su "no" de antes sigue en el state y le descalificaría sin motivo.
  if (!skipsCapacityQuestion(state) && state.q5 === CAPACITY_NO) {
    return "Sin capacidad de inversión";
  }

  return null;
};

/**
 * Decide con su socio. No descalifica: se le deja pasar y se le exige traerlo, en el
 * calendario y otra vez en la noti post-booking. Perder el lead cuesta más que la llamada.
 */
export const isSharedDecision = (state: QuizState): boolean =>
  !!state.q7?.includes("Con mi socio");

export const isQualified = (state: QuizState): boolean => getDisqualifyReason(state) === null;
