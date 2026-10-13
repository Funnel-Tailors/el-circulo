// push-instantly-sequence — crea una campaña en el Instantly del cliente con la secuencia completa
// (pasos, copy, horario, ajustes) en BORRADOR. Sin cuentas emisoras ni leads: nunca se lanza desde aquí.
// Solo admin, con su JWT y { onboarding_id }. Botón "Subir a Instantly" del panel de secuencias.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json, serviceClient, resolveCaller, dropCache } from '../_shared/auth.ts'
import { instantly, getInstantlyConnection, InstantlyError } from '../_shared/instantly.ts'

type InStep = { subject?: string; body?: string; day?: number }

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Texto plano → HTML de Instantly: un <div> por línea, como su editor (el texto suelto fuera de
// etiquetas lo borra al guardar). Los CTA "[Texto]" y "Book a call here." se convierten en enlace
// al calendario; {{first_name}} → {{firstName}} (variable de Instantly).
function toHtml(text: string, ctaUrl: string) {
  const href = escapeHtml(ctaUrl)
  return text.trim().split('\n').map((line) => {
    let l = escapeHtml(line.trimEnd()).replace(/\{\{\s*first_?name\s*\}\}/gi, '{{firstName}}')
    if (ctaUrl) {
      l = l.replace(/\[([^\]]+)\]/g, `<a href="${href}">$1</a>`)
        .replace(/^(Book a call here)(\.?)$/i, `<a href="${href}">$1</a>$2`)
    }
    return l ? `<div>${l}</div>` : '<div><br /></div>'
  }).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const supabase = serviceClient()
    const body = await req.json().catch(() => ({}))
    const caller = await resolveCaller(req, supabase, body)
    if (caller instanceof Response) return caller
    if (!caller.isAdmin || !body.onboarding_id) return json({ error: 'Solo admin' }, 403)

    const conn = await getInstantlyConnection(supabase, String(body.onboarding_id))
    if (!conn) return json({ error: 'Este cliente no tiene Instantly conectado' }, 400)

    const name = String(body.name || '').trim()
    const ctaUrl = String(body.cta_url || '').trim()
    const steps: InStep[] = (Array.isArray(body.steps) ? body.steps : []).filter((s: InStep) => String(s?.body || '').trim())
    if (!name) return json({ error: 'Falta el nombre de la campaña' }, 400)
    if (!steps.length) return json({ error: 'La secuencia no tiene pasos' }, 400)
    if (!String(steps[0].subject || '').trim()) return json({ error: 'El primer email necesita asunto' }, 400)

    const sch = body.schedule || {}
    const days: Record<string, boolean> = {}
    for (const d of (Array.isArray(sch.days) ? sch.days : [1, 2, 3, 4, 5])) days[String(d)] = true

    // Instantly: `delay` es la espera ANTES DEL SIGUIENTE email → diferencia entre días absolutos.
    const dayOf = (i: number) => Math.max(0, Number(steps[i]?.day) || 0)
    const payload = {
      name,
      campaign_schedule: {
        schedules: [{
          name: 'Laborables',
          timing: { from: sch.from || '09:00', to: sch.to || '17:00' },
          days,
          timezone: sch.timezone || 'Asia/Dubai',
        }],
      },
      sequences: [{
        steps: steps.map((s, i) => ({
          type: 'email',
          delay: i < steps.length - 1 ? Math.max(0, dayOf(i + 1) - dayOf(i)) : 0,
          delay_unit: 'days',
          // Asunto vacío = va en el mismo hilo que el anterior.
          variants: [{ subject: String(s.subject || '').trim(), body: toHtml(String(s.body), ctaUrl) }],
        })),
      }],
      stop_on_reply: true,
      stop_on_auto_reply: false,
      open_tracking: false,
      link_tracking: false,
    }

    const created = await instantly(conn.key, '/campaigns', { method: 'POST', body: payload })
    // El borrador nuevo sale ya en la sección Secuencias del portal.
    await dropCache(supabase, String(body.onboarding_id), 'sequence_drafts')
    return json({ ok: true, campaign_id: created?.id ?? null, name: created?.name ?? name, steps: steps.length })
  } catch (e) {
    if (e instanceof InstantlyError) {
      console.error('push-instantly-sequence:', e.message)
      const msg = e.status === 401 ? 'La API key de Instantly no es válida'
        : e.status === 402 ? 'La cuenta de Instantly no tiene un plan con acceso a la API'
        : e.status === 403 ? 'La API key de Instantly no tiene permiso para crear campañas'
        : `Instantly rechazó la campaña: ${e.message.slice(0, 160)}`
      return json({ error: msg }, 502)
    }
    console.error('push-instantly-sequence error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
