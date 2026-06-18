// Plantilla aplanada del roadmap DFY para instanciar hitos al crear el proyecto.
// Debe mantenerse en sync con src/data/consultoriaRoadmap.ts (lado frontend).
// weeks = semanas desde el kickoff para la fecha objetivo por defecto (null = sin fecha).
export interface MilestoneTemplate {
  key: string
  phase: string
  phase_label: string
  title: string
  sort_order: number
  optional: boolean
  weeks: number | null
}

export const MILESTONE_TEMPLATE: MilestoneTemplate[] = [
  { key: 'kickoff_call', phase: 'kickoff', phase_label: 'Kickoff', title: 'Llamada de onboarding', sort_order: 0, optional: false, weeks: 0 },
  { key: 'project_plan', phase: 'kickoff', phase_label: 'Kickoff', title: 'Plan del proyecto', sort_order: 1, optional: false, weeks: 1 },
  { key: 'oferta_definida', phase: 'oferta', phase_label: 'La Oferta', title: 'Oferta definida', sort_order: 2, optional: false, weeks: 2 },
  { key: 'icp_definido', phase: 'oferta', phase_label: 'La Oferta', title: 'ICP / Espejo definido', sort_order: 3, optional: false, weeks: 2 },
  { key: 'ads_mvp', phase: 'captacion', phase_label: 'La Captación', title: 'MVP de anuncios', sort_order: 4, optional: false, weeks: 1 },
  { key: 'crm_activado', phase: 'captacion', phase_label: 'La Captación', title: 'CRM activado', sort_order: 5, optional: false, weeks: 4 },
  { key: 'captacion_mvp', phase: 'captacion', phase_label: 'La Captación', title: 'MVP de captación en marcha', sort_order: 6, optional: false, weeks: 6 },
  { key: 'embudo_montado', phase: 'embudo', phase_label: 'El Embudo', title: 'Embudo montado', sort_order: 7, optional: false, weeks: 6 },
  { key: 'embudo_conectado', phase: 'embudo', phase_label: 'El Embudo', title: 'Embudo conectado al CRM', sort_order: 8, optional: false, weeks: 8 },
  { key: 'vsl_guion', phase: 'ventas', phase_label: 'Las Ventas', title: 'Guion de VSL', sort_order: 9, optional: false, weeks: 8 },
  { key: 'vsl_grabada', phase: 'ventas', phase_label: 'Las Ventas', title: 'VSL grabada y publicada', sort_order: 10, optional: false, weeks: 10 },
  { key: 'rebranding', phase: 'rebranding', phase_label: 'Opcional', title: 'Rebranding', sort_order: 11, optional: true, weeks: null },
  { key: 'entrega_final', phase: 'cierre', phase_label: 'Cierre', title: 'Entrega final', sort_order: 12, optional: false, weeks: 11 },
  { key: 'optimizacion', phase: 'cierre', phase_label: 'Cierre', title: 'Optimización', sort_order: 13, optional: false, weeks: 12 },
]
