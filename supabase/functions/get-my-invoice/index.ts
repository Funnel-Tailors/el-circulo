// get-my-invoice — devuelve la factura del cliente autenticado (verify_jwt=true).
// Valida el JWT, resuelve auth.uid() y entrega una signed URL fresca + metadatos.
// El cliente solo ve LO SUYO (filtramos por client_user_id con service role).
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
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ error: 'No autenticado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    const userId = userData?.user?.id
    if (userErr || !userId) return json({ error: 'Sesión no válida' }, 401)

    // Onboardings del cliente
    const { data: onboardings } = await supabase
      .from('consulting_onboardings')
      .select('id')
      .eq('client_user_id', userId)
    const ids = (onboardings ?? []).map((o: any) => o.id)
    if (!ids.length) return json({ invoice: null })

    // Última factura emitida
    const { data: invoices } = await supabase
      .from('invoices')
      .select('invoice_number, storage_path, invoice_date, due_date, total_amount_cents, currency, status')
      .in('onboarding_id', ids)
      .eq('status', 'issued')
      .order('issued_at', { ascending: false })
      .limit(1)

    const inv = (invoices ?? [])[0]
    if (!inv) return json({ invoice: null })

    let url: string | null = null
    if (inv.storage_path) {
      const { data: signed } = await supabase.storage
        .from('invoices')
        .createSignedUrl(inv.storage_path, 300)
      url = signed?.signedUrl ?? null
    }

    return json({
      invoice: {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        total_amount_cents: inv.total_amount_cents,
        currency: inv.currency,
        url,
      },
    })
  } catch (e) {
    console.error('get-my-invoice error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
