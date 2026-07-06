export type QuizState = {
  q1?: string; // Frustración/Pain Point
  q2?: string; // Profesión
  q3?: string; // Facturación mensual
  q4?: string[]; // LEGACY: Métodos de adquisición (ya no se pregunta)
  q5?: string; // Presupuesto/vía DIY-DFY (paso 4 visual) → custom field quiz_budget
  q6?: string; // LEGACY: Urgencia/timeline (retirado, sustituido por q5 presupuesto)
  q7?: string; // Autoridad de decisión (ahora paso 5 visual)
  name?: string;
  email?: string;
  whatsapp?: string;
  ghlContactId?: string;
  isSkeptic?: boolean; // True si entró por popup "El Espejo"
};
