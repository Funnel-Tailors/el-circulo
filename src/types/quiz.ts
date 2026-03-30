export type QuizState = {
  q1?: string; // Frustración/Pain Point
  q2?: string; // Profesión
  q3?: string; // Facturación mensual
  q4?: string[]; // LEGACY: Métodos de adquisición (ya no se pregunta)
  q5?: string; // LEGACY: Presupuesto de inversión (ya no se pregunta)
  q6?: string; // Urgencia/Compromiso (ahora paso 4 visual)
  q7?: string; // Autoridad de decisión (ahora paso 5 visual)
  name?: string;
  email?: string;
  whatsapp?: string;
  ghlContactId?: string;
  isSkeptic?: boolean; // True si entró por popup "El Espejo"
};
