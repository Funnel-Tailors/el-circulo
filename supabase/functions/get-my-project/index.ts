// get-my-project — estado del proyecto del cliente autenticado (verify_jwt=true).
// Devuelve hitos ordenados + entregables visibles (con signed URLs para ficheros).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ error: 'No autenticado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    const userId = userData?.user?.id
    if (userErr || !userId) return json({ error: 'Sesión no válida' }, 401)

    // Admin puede ver el proyecto de un cliente concreto (onboarding_id en el body)
    const body = await req.json().catch(() => ({}))
    let obIds: string[] = []
    if (body?.onboarding_id) {
      const { data: roles } = await supabase
        .from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').limit(1)
      if (roles?.length) obIds = [body.onboarding_id]
    }
    if (!obIds.length) {
      const { data: onboardings } = await supabase
        .from('consulting_onboardings')
        .select('id')
        .eq('client_user_id', userId)
      obIds = (onboardings ?? []).map((o: any) => o.id)
    }
    if (!obIds.length) return json({ project: null, milestones: [] })

    const { data: project } = await supabase
      .from('consulting_projects')
      .select('id, current_phase, status, start_date, completion_pct, vsl_title, vsl_copy')
      .in('onboarding_id', obIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!project) return json({ project: null, milestones: [] })

    const { data: milestones } = await supabase
      .from('consulting_milestones')
      .select('id, key, phase, phase_label, title, sort_order, status, optional, target_date, completed_at, note')
      .eq('project_id', project.id)
      .order('sort_order', { ascending: true })

    const msIds = (milestones ?? []).map((m: any) => m.id)
    let deliverables: any[] = []
    if (msIds.length) {
      const { data: dels } = await supabase
        .from('consulting_deliverables')
        .select('id, milestone_id, type, title, url, storage_path, note')
        .in('milestone_id', msIds)
        .eq('visible_to_client', true)
        .order('created_at', { ascending: true })
      deliverables = dels ?? []
    }

    // Signed URLs para ficheros del bucket privado
    for (const d of deliverables) {
      if (d.type === 'file' && d.storage_path) {
        const { data: signed } = await supabase.storage.from('deliverables').createSignedUrl(d.storage_path, 300)
        d.url = signed?.signedUrl ?? null
      }
      delete d.storage_path
    }

    const byMilestone: Record<string, any[]> = {}
    for (const d of deliverables) (byMilestone[d.milestone_id] ??= []).push(d)

    const enriched = (milestones ?? []).map((m: any) => ({
      ...m,
      deliverables: byMilestone[m.id] ?? [],
    }))

    return json({ project, milestones: enriched })
  } catch (e) {
    console.error('get-my-project error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
