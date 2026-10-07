// Plantillas del portal de cliente. Cada proyecto elige una en consulting_projects.portal_config.
// Sin plantilla (portal_config vacío) = "vsl_call_funnel": el portal de siempre, sin cambios.
import {
  LayoutDashboard, ScrollText, Megaphone, MonitorPlay, Headset, GraduationCap,
  FileText, CalendarClock, KeyRound, Workflow, Send, History,
} from "lucide-react";

export type SectionId =
  | "resumen" | "vsl" | "anuncios" | "funnel" | "guiones" | "formacion"
  | "documentos" | "agenda" | "cuenta" | "pipelines" | "outbound" | "secuencias";

export type TemplateId = "vsl_call_funnel" | "outbound_recruiting";

export interface NavItem { id: SectionId; label: string; icon: any }

const S: Record<SectionId, NavItem> = {
  resumen: { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  vsl: { id: "vsl", label: "VSL", icon: ScrollText },
  anuncios: { id: "anuncios", label: "Anuncios", icon: Megaphone },
  funnel: { id: "funnel", label: "Funnel", icon: MonitorPlay },
  guiones: { id: "guiones", label: "Guiones", icon: Headset },
  formacion: { id: "formacion", label: "Formación", icon: GraduationCap },
  documentos: { id: "documentos", label: "Documentos", icon: FileText },
  agenda: { id: "agenda", label: "Agenda", icon: CalendarClock },
  cuenta: { id: "cuenta", label: "Cuenta", icon: KeyRound },
  pipelines: { id: "pipelines", label: "Pipelines", icon: Workflow },
  outbound: { id: "outbound", label: "Outbound", icon: Send },
  secuencias: { id: "secuencias", label: "Secuencias", icon: History },
};

export interface PortalTemplate { id: TemplateId; label: string; description: string; nav: NavItem[] }

export const PORTAL_TEMPLATES: Record<TemplateId, PortalTemplate> = {
  vsl_call_funnel: {
    id: "vsl_call_funnel",
    label: "VSL Call funnel",
    description: "Anuncios → funnel con VSL → llamada. El portal de siempre.",
    nav: [S.resumen, S.vsl, S.anuncios, S.funnel, S.guiones, S.formacion, S.documentos, S.agenda, S.cuenta],
  },
  outbound_recruiting: {
    id: "outbound_recruiting",
    label: "Outbound · pipelines",
    description: "Cold email (Instantly) + LinkedIn, varias pipelines en el CRM y gestión desde el portal.",
    nav: [S.resumen, S.pipelines, S.outbound, S.secuencias, S.funnel, S.documentos, S.agenda, S.cuenta],
  },
};

export function getTemplate(id?: string | null): PortalTemplate {
  return PORTAL_TEMPLATES[(id as TemplateId) ?? "vsl_call_funnel"] ?? PORTAL_TEMPLATES.vsl_call_funnel;
}

// ── Forma de portal_config (se edita en el panel admin) ──
export interface PipelineConfig { key: string; label: string; ghl_pipeline_id: string }
export interface PortalConfig {
  template?: TemplateId;
  pipelines?: PipelineConfig[];
  channels?: Record<string, { tags: string[]; sources: string[] }>;
  instantly?: { target_pipeline?: string; stage_map?: { replied?: string; interested?: string; meeting?: string } };
}
