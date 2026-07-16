import { useQuery } from '@tanstack/react-query';
import { aggregateProject, fetchFunnelEvents, type ProjectStats } from '@/lib/funnelStats';
import { CIRCULO_INTERNAL_SLUG, fetchLegacyCirculoEvents } from '@/lib/funnelStatsLegacy';

/**
 * Stats del funnel del cliente logueado en el portal.
 * RLS solo le deja leer los eventos de su tracking_slug (policy
 * "Clients view own funnel events"); el admin en modo ?preview los ve todos.
 *
 * Caso especial El Círculo: nuestro embudo VSL interno no escribe a
 * client_funnel_events — su historial vive en las tablas viejas. Para ese slug
 * leemos vía adaptador (funnelStatsLegacy) y agregamos con el MISMO aggregateProject.
 */
export function usePortalFunnelStats(slug: string | null | undefined, days: number) {
  const query = useQuery({
    queryKey: ['portal-funnel-stats', slug, days],
    enabled: !!slug,
    queryFn: async (): Promise<ProjectStats> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const events =
        slug === CIRCULO_INTERNAL_SLUG
          ? await fetchLegacyCirculoEvents(since)
          : await fetchFunnelEvents(since, slug!);
      return aggregateProject(slug!, slug!, events);
    },
    staleTime: 60_000,
  });

  return {
    stats: query.data ?? null,
    loading: query.isLoading && !!slug,
    error: query.error,
  };
}
