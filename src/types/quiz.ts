export type QuizState = {
  q1?: string; // Frustración/Pain Point
  q2?: string; // Profesión
  q3?: string; // Facturación mensual
  q4?: string[]; // Métodos de adquisición
  q5?: string; // Presupuesto de inversión
  q6?: string; // Urgencia/Compromiso
  q7?: string; // Autoridad de decisión
  name?: string;
  email?: string;
  whatsapp?: string;
  ghlContactId?: string;
  isSkeptic?: boolean; // True si entró por popup "El Espejo"
};
