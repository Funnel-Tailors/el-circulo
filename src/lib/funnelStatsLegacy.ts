import { supabase } from '@/integrations/supabase/client';
import type { EventRow } from '@/lib/funnelStats';

/**
 * Adaptador del embudo VSL INTERNO de El Círculo a las stats del portal.
 *
 * El funnel interno (home /, VSL en CircleHero, HomeQuiz, form) nunca escribió a
 * client_funnel_events: su historial vive en las tablas viejas (quiz_analytics +
 * vsl_views + meta_pixel_events, alimentadas por src/lib/analytics.ts).
 *
 * Este módulo lee esas tablas y las traduce al mismo shape (EventRow[]) que
 * aggregateProject() de funnelStats.ts espera, de modo que El Círculo se ve en
 * /portal como un cliente más — con TODO el historial, sin re-instrumentar nada.
 *
 * Se engancha en usePortalFunnelStats cuando el slug es CIRCULO_INTERNAL_SLUG.
 */
export const CIRCULO_INTERNAL_SLUG = 'circulo';

const PAGE_SIZE = 1000;
const MAX_ROWS = 50000;

// vsl_25_percent / vsl_50_percent … → hito "25"/"50"/…
const VSL_PCT_EVENT = /^vsl_(\d+)_percent$/;

interface UtmDevice {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  device_type: string | null;
}

function row(
  event_type: string,
  step: string | null,
  session_id: string,
  created_at: string,
  ctx: UtmDevice,
  metadata: unknown = null,
): EventRow {
  return {
    project_slug: CIRCULO_INTERNAL_SLUG,
    event_type,
    step,
    session_id,
    page_path: '/',
    utm_source: ctx.utm_source,
    utm_medium: ctx.utm_medium,
    utm_campaign: ctx.utm_campaign,
    referrer: ctx.referrer,
    device_type: ctx.device_type,
    metadata,
    created_at,
  };
}

/** Trae todas las filas de una tabla legacy paginando por created_at. */
async function fetchAll<T>(table: string, columns: string, sinceIso: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table as any)
      .select(columns)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return out;
}

interface QuizRow extends UtmDevice {
  event_type: string;
  step_id: string | null;
  answer_value: string | null;
  session_id: string;
  created_at: string;
}
interface VslRow extends UtmDevice {
  session_id: string;
  user_interacted: boolean | null;
  video_percentage_watched: number | null;
  created_at: string;
}
interface PixelRow {
  session_id: string;
  event_name: string;
  content_category: string | null;
  content_ids: string[] | null;
  created_at: string;
}

/**
 * Reconstruye el stream de eventos del funnel interno en formato client_funnel_events.
 * Mapeo:
 *   vsl_views (una fila = una sesión que vio el VSL, ~una visita a /)  → page_view
 *     · user_interacted = true                                          → vsl_play
 *     · video_percentage_watched ≥ 25/50/75/100                         → vsl_progress
 *   quiz_analytics.question_answered                                    → funnel_step (step = step_id)
 *   quiz_analytics.vsl_unmuted                                          → vsl_play
 *   quiz_analytics.vsl_XX_percent                                       → vsl_progress ("25"/"50"…)
 *   quiz_analytics.contact_form_submitted | quiz_completed             → lead_submit
 *   meta_pixel_events (content 'quiz_disqualified')                    → disqualified
 * aggregateProject dedup por sesión+paso (Set), así que solapes de fuentes son inocuos.
 */
export async function fetchLegacyCirculoEvents(sinceIso: string): Promise<EventRow[]> {
  const [quiz, vsl, pixel] = await Promise.all([
    fetchAll<QuizRow>(
      'quiz_analytics',
      'event_type, step_id, answer_value, session_id, created_at, utm_source, utm_medium, utm_campaign, referrer, device_type',
      sinceIso,
    ),
    fetchAll<VslRow>(
      'vsl_views',
      'session_id, user_interacted, video_percentage_watched, created_at, utm_source, utm_medium, utm_campaign, referrer, device_type',
      sinceIso,
    ),
    fetchAll<PixelRow>(
      'meta_pixel_events',
      'session_id, event_name, content_category, content_ids, created_at',
      sinceIso,
    ).catch(() => [] as PixelRow[]),
  ]);

  const events: EventRow[] = [];

  // ── vsl_views: base de sesiones/visitas + play + retención ──
  for (const v of vsl) {
    events.push(row('page_view', null, v.session_id, v.created_at, v));
    if (v.user_interacted) events.push(row('vsl_play', null, v.session_id, v.created_at, v, { mode: 'file' }));
    const pct = v.video_percentage_watched ?? 0;
    for (const milestone of [25, 50, 75, 100]) {
      if (pct >= milestone) events.push(row('vsl_progress', String(milestone), v.session_id, v.created_at, v));
    }
  }

  // ── quiz_analytics: pasos del quiz, lead, y eventos VSL discretos ──
  for (const q of quiz) {
    const pctMatch = q.event_type.match(VSL_PCT_EVENT);
    if (pctMatch) {
      events.push(row('vsl_progress', pctMatch[1], q.session_id, q.created_at, q));
    } else if (q.event_type === 'vsl_unmuted') {
      events.push(row('vsl_play', null, q.session_id, q.created_at, q, { mode: 'file' }));
    } else if (q.event_type === 'question_answered' && q.step_id) {
      events.push(row('funnel_step', q.step_id, q.session_id, q.created_at, q, { value: q.answer_value }));
    } else if (q.event_type === 'contact_form_submitted' || q.event_type === 'quiz_completed') {
      events.push(row('lead_submit', null, q.session_id, q.created_at, q));
    }
  }

  // ── meta_pixel_events: descalificaciones (única fuente del signal) ──
  for (const p of pixel) {
    const isDisq =
      p.content_category === 'negative_signal' ||
      (p.content_ids ?? []).some((id) => id?.startsWith('disqualified'));
    if (isDisq) {
      events.push(row('disqualified', null, p.session_id, p.created_at, {
        utm_source: null, utm_medium: null, utm_campaign: null, referrer: null, device_type: null,
      }));
    }
  }

  events.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return events;
}
