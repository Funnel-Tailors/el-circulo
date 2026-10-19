// Roadmap preset para proyectos outbound (primer cliente: THE HUMAN LAYER).
// Lo carga el admin desde "Mapa del proyecto" y luego se ajusta a mano por cliente.
// day = días desde el kickoff para la fecha objetivo (null = sin fecha; en los hitos
// hechos sin fecha conocida no se muestra ninguna).

type TaskStatus = "pending" | "in_progress" | "done";
type MsStatus = "pending" | "in_progress" | "done" | "blocked";

export interface PresetTask { title: string; status?: TaskStatus; owner?: "circulo" | "cliente" }
export interface PresetMilestone {
  key: string; phase: string; phase_label: string; title: string;
  description?: string; status: MsStatus; day: number | null; tasks: PresetTask[];
}

const done = (title: string, owner?: "cliente"): PresetTask => ({ title, status: "done", owner });
const doing = (title: string, owner?: "cliente"): PresetTask => ({ title, status: "in_progress", owner });
const todo = (title: string, owner?: "cliente"): PresetTask => ({ title, owner });

export const OUTBOUND_FOCUS =
  "Configurando las automatizaciones del CRM mientras termina el warmup de los buzones. En cuanto acabe, activamos la primera campaña de cold email.";

export const OUTBOUND_ROADMAP: PresetMilestone[] = [
  // ── Hecho ──
  {
    key: "out_kickoff", phase: "arranque", phase_label: "Arranque", title: "Onboarding y plan",
    description: "Llamada de onboarding, propuesta estratégica y acuerdo firmado.",
    status: "done", day: null,
    tasks: [done("Llamada de onboarding"), done("Propuesta estratégica y hoja de ruta"), done("Acuerdo firmado")],
  },
  {
    key: "out_oferta", phase: "oferta", phase_label: "Oferta", title: "Oferta e ICP definidos",
    description: "A quién nos dirigimos y qué le ofrecemos: la base de todo el outreach.",
    status: "done", day: null,
    tasks: [done("Oferta corporativa definida"), done("Perfil de cliente ideal y mercados prioritarios")],
  },
  {
    key: "out_infra", phase: "infraestructura", phase_label: "Infraestructura", title: "Infraestructura base montada",
    description: "CRM, herramientas internas y web listos para recibir y gestionar clientes y candidatos.",
    status: "done", day: null,
    tasks: [
      done("CRM con pipelines de empresas y candidatos"),
      done("Calendario de intake calls"),
      done("Web y formularios de empresas y candidatos"),
      done("Herramientas internas: propuestas, contratos y assessments"),
    ],
  },
  {
    key: "out_conexion", phase: "infraestructura", phase_label: "Infraestructura", title: "CRM · Instantly · Portal conectados",
    description: "Todo el sistema hablando entre sí: lo que pasa en Instantly llega al CRM y se ve en el portal.",
    status: "done", day: null,
    tasks: [
      done("Instantly conectado al CRM (respuestas, interesados y reuniones)"),
      done("Portal con panel de captación en tiempo real"),
    ],
  },
  {
    key: "out_secuencias", phase: "secuencias", phase_label: "Secuencias", title: "Secuencias de cold email",
    description: "Mensajes de outreach redactados y cargados en Instantly, listos para activar.",
    status: "done", day: null,
    tasks: [done("Dos secuencias redactadas"), done("Cargadas en Instantly en borrador")],
  },
  // ── En curso ──
  {
    key: "out_warmup", phase: "envio", phase_label: "Cuentas y dominios", title: "Warmup de dominios y buzones",
    description: "Calentamos los buzones para que los correos lleguen a bandeja de entrada y no a spam.",
    status: "in_progress", day: 17,
    tasks: [done("Cuentas y dominios de envío creados"), doing("Calentamiento de buzones")],
  },
  {
    key: "out_crm_auto", phase: "automatizacion", phase_label: "Automatización", title: "Automatizaciones del CRM",
    description: "Que cada contacto avance solo por el pipeline y nadie se quede sin seguimiento.",
    status: "in_progress", day: 21,
    tasks: [
      done("Formularios, propuestas y contratos mueven el pipeline solos"),
      doing("Workflows de seguimiento y recordatorios"),
    ],
  },
  {
    key: "out_tutorial", phase: "automatizacion", phase_label: "Automatización", title: "Tutorial de la infraestructura privada",
    description: "Guía para que tu equipo use las herramientas internas sin depender de nosotros.",
    status: "in_progress", day: 25,
    tasks: [doing("Grabación del tutorial"), todo("Entrega de accesos y documentación")],
  },
  // ── Próximo ──
  {
    key: "out_lanzamiento", phase: "lanzamiento", phase_label: "Lanzamiento", title: "Primera campaña activa",
    description: "Arranca en cuanto termine el warmup.",
    status: "pending", day: 18,
    tasks: [todo("Activar la primera campaña en Instantly"), todo("Primeras respuestas gestionadas en el CRM"), todo("Primeras intake calls agendadas")],
  },
  {
    key: "out_captacion", phase: "captacion", phase_label: "Captación", title: "Landing de captación con carta de ventas",
    status: "pending", day: 42,
    tasks: [todo("Pixel de Meta en el formulario de empresas"), todo("Funnel con carta de ventas"), todo("Secuencia de LinkedIn")],
  },
  {
    key: "out_crucero", phase: "crucero", phase_label: "Velocidad de crucero", title: "Sistema en régimen",
    description: "El sistema funciona a volumen estable y lo optimizamos con datos.",
    status: "pending", day: 92,
    tasks: [
      todo("Volumen diario objetivo estable"),
      todo("Primera iteración del copy según el reply rate"),
      todo("Revisión semanal de métricas"),
      todo("Decidir el canal ganador: outreach o paid media"),
    ],
  },
];
