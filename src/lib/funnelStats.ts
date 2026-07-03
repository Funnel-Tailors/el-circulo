import { supabase } from '@/integrations/supabase/client';

/**
 * Agregación de eventos de funnels de clientes (client_funnel_events).
 * Compartido por el admin (useClientFunnelData) y el portal (usePortalFunnelStats).
 * El volumen por funnel es bajo → se agrega en cliente, sin RPCs.
 */

export interface TrackingProject {
  slug: string;
  name: string;
  active: boolean;
}

export interface EventRow {
  project_slug: string;
  event_type: string;
  step: string | null;
  session_id: string;
  page_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  device_type: string | null;
  metadata: unknown;
  created_at: string;
}

export interface FunnelStepStat {
  step_id: string;
  step_index: number;
  sessions_reached: number;
  conversion_rate_percent: number | null;
}

export interface UTMRow {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  sessions: number;
  conversions: number;
  conversion_rate: number;
}

export interface DailyPoint {
  date: string;
  sessions: number;
  leads: number;
}

export interface RecentSession {
  session_id: string;
  started_at: string;
  device_type: string;
  utm_source: string;
  steps_completed: number;
  lead: boolean;
  last_event: string;
}

export interface VslStats {
  plays: number;
  milestones: { pct: string; sessions: number }[];
}

export interface ProjectStats {
  slug: string;
  name: string;
  sessions: number;
  pageViews: number;
  funnelStarts: number;
  leads: number;
  disqualified: number;
  conversionRate: number;
  paidShare: number;
  topSource: string;
  biggestDropStep: string;
  deviceSplit: { device: string; sessions: number }[];
  funnel: FunnelStepStat[];
  utm: UTMRow[];
  daily: DailyPoint[];
  recentSessions: RecentSession[];
  vsl: VslStats | null;
}

const PAGE_SIZE = 1000;
const MAX_ROWS = 50000;

const EVENT_COLUMNS =
  'project_slug, event_type, step, session_id, page_path, utm_source, utm_medium, utm_campaign, referrer, device_type, metadata, created_at';

/** Trae eventos paginados. RLS ya limita lo visible (admin: todo; cliente: su slug). */
export async function fetchFunnelEvents(
  sinceIso: string,
  projectSlug?: string
): Promise<EventRow[]> {
  const rows: EventRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    let query = supabase
      .from('client_funnel_events')
      .select(EVENT_COLUMNS)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (projectSlug) query = query.eq('project_slug', projectSlug);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...((data ?? []) as EventRow[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export function aggregateProject(slug: string, name: string, events: EventRow[]): ProjectStats {
  const sessions = new Map<string, EventRow[]>();
  for (const e of events) {
    const list = sessions.get(e.session_id) ?? [];
    list.push(e);
    sessions.set(e.session_id, list);
  }

  const totalSessions = sessions.size;
  const pageViews = events.filter((e) => e.event_type === 'page_view').length;

  const leadSessions = new Set(
    events.filter((e) => e.event_type === 'lead_submit').map((e) => e.session_id)
  );
  const disqualifiedSessions = new Set(
    events.filter((e) => e.event_type === 'disqualified').map((e) => e.session_id)
  );
  const funnelStartSessions = new Set(
    events.filter((e) => e.event_type === 'funnel_step').map((e) => e.session_id)
  );

  // ── Embudo por pasos: visita → pasos (orden natural = sesiones desc) → lead
  const stepSessions = new Map<string, Set<string>>();
  for (const e of events) {
    if (e.event_type !== 'funnel_step' || !e.step) continue;
    const set = stepSessions.get(e.step) ?? new Set<string>();
    set.add(e.session_id);
    stepSessions.set(e.step, set);
  }
  const orderedSteps = [...stepSessions.entries()].sort((a, b) => b[1].size - a[1].size);
  const funnel: FunnelStepStat[] = [
    { step_id: 'Visita', step_index: 0, sessions_reached: totalSessions, conversion_rate_percent: null },
    ...orderedSteps.map(([step, set], i) => {
      const prev = i === 0 ? totalSessions : orderedSteps[i - 1][1].size;
      return {
        step_id: step,
        step_index: i + 1,
        sessions_reached: set.size,
        conversion_rate_percent: prev ? Math.round((set.size / prev) * 1000) / 10 : null,
      };
    }),
    {
      step_id: 'Lead',
      step_index: orderedSteps.length + 1,
      sessions_reached: leadSessions.size,
      conversion_rate_percent: orderedSteps.length
        ? Math.round((leadSessions.size / Math.max(orderedSteps[orderedSteps.length - 1][1].size, 1)) * 1000) / 10
        : null,
    },
  ];

  // Paso con mayor abandono (menor tasa de paso)
  let biggestDropStep = '—';
  let worstRate = Infinity;
  for (const s of funnel) {
    if (s.conversion_rate_percent !== null && s.sessions_reached > 0 && s.conversion_rate_percent < worstRate) {
      worstRate = s.conversion_rate_percent;
      biggestDropStep = s.step_id;
    }
  }

  // ── UTM performance (por sesión; el snippet garantiza first-touch)
  const utmGroups = new Map<
    string,
    { source: string; medium: string; campaign: string; sessions: Set<string>; conversions: Set<string> }
  >();
  for (const [sid, evs] of sessions) {
    const withUtm = evs.find((e) => e.utm_source || e.utm_medium || e.utm_campaign);
    const source = withUtm?.utm_source ?? '(directo)';
    const medium = withUtm?.utm_medium ?? '—';
    const campaign = withUtm?.utm_campaign ?? '—';
    const key = `${source}|${medium}|${campaign}`;
    const g = utmGroups.get(key) ?? { source, medium, campaign, sessions: new Set(), conversions: new Set() };
    g.sessions.add(sid);
    if (leadSessions.has(sid)) g.conversions.add(sid);
    utmGroups.set(key, g);
  }
  const utm: UTMRow[] = [...utmGroups.values()]
    .map((g) => ({
      utm_source: g.source,
      utm_medium: g.medium,
      utm_campaign: g.campaign,
      sessions: g.sessions.size,
      conversions: g.conversions.size,
      conversion_rate: g.sessions.size ? Math.round((g.conversions.size / g.sessions.size) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  const paidSessions = [...sessions.entries()].filter(([, evs]) =>
    evs.some((e) => e.utm_source || e.utm_medium)
  ).length;

  // ── Serie diaria
  const dailyMap = new Map<string, { sessions: Set<string>; leads: Set<string> }>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    const d = dailyMap.get(day) ?? { sessions: new Set(), leads: new Set() };
    d.sessions.add(e.session_id);
    if (e.event_type === 'lead_submit') d.leads.add(e.session_id);
    dailyMap.set(day, d);
  }
  const daily: DailyPoint[] = [...dailyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, d]) => ({ date, sessions: d.sessions.size, leads: d.leads.size }));

  // ── Dispositivos
  const deviceMap = new Map<string, Set<string>>();
  for (const [sid, evs] of sessions) {
    const device = evs[0]?.device_type ?? 'desconocido';
    const set = deviceMap.get(device) ?? new Set<string>();
    set.add(sid);
    deviceMap.set(device, set);
  }
  const deviceSplit = [...deviceMap.entries()]
    .map(([device, set]) => ({ device, sessions: set.size }))
    .sort((a, b) => b.sessions - a.sessions);

  // ── VSL (solo si el funnel emite vsl_play / vsl_progress)
  const vslPlays = new Set(
    events.filter((e) => e.event_type === 'vsl_play').map((e) => e.session_id)
  );
  const vslMilestones = ['25', '50', '75', '100'].map((pct) => ({
    pct,
    sessions: new Set(
      events.filter((e) => e.event_type === 'vsl_progress' && e.step === pct).map((e) => e.session_id)
    ).size,
  }));
  const hasVsl = vslPlays.size > 0 || vslMilestones.some((m) => m.sessions > 0);
  const vsl: VslStats | null = hasVsl ? { plays: vslPlays.size, milestones: vslMilestones } : null;

  // ── Sesiones recientes
  const recentSessions: RecentSession[] = [...sessions.entries()]
    .map(([sid, evs]) => {
      const sorted = [...evs].sort((a, b) => a.created_at.localeCompare(b.created_at));
      return {
        session_id: sid,
        started_at: sorted[0].created_at,
        device_type: sorted[0].device_type ?? '—',
        utm_source: sorted.find((e) => e.utm_source)?.utm_source ?? '(directo)',
        steps_completed: new Set(
          sorted.filter((e) => e.event_type === 'funnel_step' && e.step).map((e) => e.step)
        ).size,
        lead: leadSessions.has(sid),
        last_event: sorted[sorted.length - 1].event_type,
      };
    })
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .slice(0, 25);

  return {
    slug,
    name,
    sessions: totalSessions,
    pageViews,
    funnelStarts: funnelStartSessions.size,
    leads: leadSessions.size,
    disqualified: disqualifiedSessions.size,
    conversionRate: totalSessions ? Math.round((leadSessions.size / totalSessions) * 1000) / 10 : 0,
    paidShare: totalSessions ? Math.round((paidSessions / totalSessions) * 100) : 0,
    topSource: utm[0]?.utm_source ?? '—',
    biggestDropStep,
    deviceSplit,
    funnel,
    utm,
    daily,
    recentSessions,
    vsl,
  };
}
