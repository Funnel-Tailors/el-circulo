import { useQuery } from '@tanstack/react-query';
import { aggregateProject, fetchFunnelEvents, type ProjectStats } from '@/lib/funnelStats';

/**
 * Stats del funnel del cliente logueado en el portal.
 * RLS solo le deja leer los eventos de su tracking_slug (policy
 * "Clients view own funnel events"); el admin en modo ?preview los ve todos.
 */
export function usePortalFunnelStats(slug: string | null | undefined, days: number) {
  const query = useQuery({
    queryKey: ['portal-funnel-stats', slug, days],
    enabled: !!slug,
    queryFn: async (): Promise<ProjectStats> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const events = await fetchFunnelEvents(since, slug!);
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
