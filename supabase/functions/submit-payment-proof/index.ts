// submit-payment-proof — el cliente sube el comprobante de pago (Wise/transferencia).
// Obligatorio para desbloquear el calendario. Idempotente. Tag GHL best-effort.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const GHL_BASE = 'https://services.leadconnectorhq.com'
const MAX_BYTES = 10 * 1024 * 1024 // 10MB

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function extFor(contentType: string): string {
  if (contentType.includes('pdf')) return 'pdf'
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  return 'bin'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const { token, file_base64, content_type } = await req.json()
    if (!token || !file_base64) return json({ ok: false, error: 'Faltan datos' }, 400)

    const ct = String(content_type || 'application/octet-stream')
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
    if (!allowed.some((a) => ct.includes(a.split('/')[1]))) {
      return json({ ok: false, error: 'Formato no permitido (imagen o PDF)' }, 400)
    }

    // Decodificar base64 (sin prefijo data:)
    const b64 = String(file_base64).replace(/^data:[^;]+;base64,/, '')
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    if (bin.byteLength > MAX_BYTES) return json({ ok: false, error: 'Archivo demasiado grande (máx 10MB)' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: ob } = await supabase
      .from('consulting_onboardings')
      .select('id, ghl_contact_id, payment_claimed_at')
      .eq('token', token)
      .maybeSingle()
    if (!ob) return json({ ok: false, error: 'Onboarding no encontrado' }, 404)

    const path = `${ob.id}/comprobante.${extFor(ct)}`
    const { error: upErr } = await supabase.storage
      .from('payment-proofs')
      .upload(path, bin, { contentType: ct, upsert: true })
    if (upErr) {
      console.error('upload error:', upErr)
      return json({ ok: false, error: 'No se pudo subir el comprobante' }, 500)
    }

    await supabase
      .from('consulting_onboardings')
      .update({
        payment_proof_path: path,
        payment_claimed_at: ob.payment_claimed_at || new Date().toISOString(),
        status: 'payment_claimed',
      })
      .eq('id', ob.id)

    // Tag GHL best-effort
    try {
      const ghlToken = Deno.env.get('GHL_API_TOKEN')
      if (ghlToken && ob.ghl_contact_id) {
        await fetch(`${GHL_BASE}/contacts/${ob.ghl_contact_id}/tags`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlToken}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tags: ['🧾 CÍRCULO-COMPROBANTE-SUBIDO', '💳 CÍRCULO-PAGO-RECLAMADO'] }),
        })
      }
    } catch (e) {
      console.error('GHL tag failed (non-blocking):', e)
    }

    return json({ ok: true })
  } catch (e) {
    console.error('submit-payment-proof error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
