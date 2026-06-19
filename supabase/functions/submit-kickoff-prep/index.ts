// submit-kickoff-prep — el cliente rellena el brief de kickoff en el onboarding
// (antes de agendar). Token-based (no autenticado). Escribe consulting_kickoff_prep.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)
  try {
    const { token, offer_oneliner, monthly_revenue, sells, links, goal_90d, checklist } = await req.json()
    if (!token) return json({ ok: false, error: 'Falta token' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: ob } = await supabase
      .from('consulting_onboardings').select('id').eq('token', token).maybeSingle()
    if (!ob) return json({ ok: false, error: 'Onboarding no encontrado' }, 404)

    const { error } = await supabase.from('consulting_kickoff_prep').upsert({
      onboarding_id: ob.id,
      offer_oneliner: offer_oneliner || null,
      monthly_revenue: monthly_revenue || null,
      sells: sells || null,
      links: links || null,
      goal_90d: goal_90d || null,
      checklist: checklist || {},
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'onboarding_id' })
    if (error) { console.error('kickoff upsert error:', error); return json({ ok: false, error: 'No se pudo guardar' }, 500) }

    return json({ ok: true })
  } catch (e) {
    console.error('submit-kickoff-prep error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
