import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  aggregateProject,
  fetchFunnelEvents,
  type ProjectStats,
  type TrackingProject,
} from '@/lib/funnelStats';
import { CIRCULO_INTERNAL_SLUG, fetchLegacyCirculoEvents } from '@/lib/funnelStatsLegacy';

export type {
  TrackingProject,
  ProjectStats,
  FunnelStepStat,
  UTMRow,
  DailyPoint,
  RecentSession,
} from '@/lib/funnelStats';

/** Vista admin: todos los proyectos de tracking agregados (requiere rol admin por RLS). */
export function useClientFunnelData(days: number) {
  const query = useQuery({
    queryKey: ['client-funnel-data', days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      // El Círculo (slug 'circulo') no vive en client_funnel_events: su historial
      // sale del adaptador sobre las tablas viejas. Se une al mismo pool de eventos
      // (ya llevan project_slug='circulo') y el filtro por proyecto lo recoge solo.
      const [{ data: projects, error: pErr }, baseEvents, legacyEvents] = await Promise.all([
        supabase.from('tracking_projects').select('slug, name, active').order('name'),
        fetchFunnelEvents(since),
        fetchLegacyCirculoEvents(since).catch(() => []),
      ]);
      if (pErr) throw pErr;
      const events = [
        ...baseEvents.filter((e) => e.project_slug !== CIRCULO_INTERNAL_SLUG),
        ...legacyEvents,
      ];

      const byProject: Record<string, ProjectStats> = {};
      for (const p of (projects ?? []) as TrackingProject[]) {
        byProject[p.slug] = aggregateProject(
          p.slug,
          p.name,
          events.filter((e) => e.project_slug === p.slug)
        );
      }
      return { projects: (projects ?? []) as TrackingProject[], byProject };
    },
    staleTime: 60_000,
  });

  return {
    projects: query.data?.projects ?? [],
    byProject: query.data?.byProject ?? {},
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
