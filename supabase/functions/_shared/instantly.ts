// Cliente Instantly API v2. La API key es la de la cuenta del cliente: solo vive en el servidor.

const INSTANTLY_BASE = 'https://api.instantly.ai/api/v2'

export class InstantlyError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function instantly(key: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${INSTANTLY_BASE}${path}`, {
      method: init.method || 'GET',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
    if (res.status === 429 && attempt < 2) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue }
    const text = await res.text()
    if (!res.ok) throw new InstantlyError(res.status, `Instantly ${init.method || 'GET'} ${path.split('?')[0]} → ${res.status} ${text.slice(0, 200)}`)
    return text ? JSON.parse(text) : {}
  }
}

export async function getInstantlyConnection(supabase: any, onboardingId: string) {
  const { data } = await supabase
    .from('consulting_instantly_connections')
    .select('api_key, campaign_ids, last_synced_at')
    .eq('onboarding_id', onboardingId)
    .maybeSingle()
  if (!data?.api_key) return null
  return { key: data.api_key as string, campaignIds: (data.campaign_ids as string[]) ?? [], lastSyncedAt: data.last_synced_at as string | null }
}

// Todas las campañas (paginado por cursor).
export async function listCampaigns(key: string): Promise<{ id: string; name: string; status: number }[]> {
  let out: any[] = []
  let cursor = ''
  for (let i = 0; i < 10; i++) {
    const r = await instantly(key, `/campaigns?limit=100${cursor ? `&starting_after=${encodeURIComponent(cursor)}` : ''}`)
    out = out.concat(r.items || [])
    if (!r.next_starting_after || !(r.items || []).length) break
    cursor = r.next_starting_after
  }
  return out.map((c) => ({ id: c.id, name: c.name, status: Number(c.status) }))
}

export const CAMPAIGN_STATUS: Record<number, string> = {
  0: 'Borrador', 1: 'Activa', 2: 'Pausada', 3: 'Completada', 4: 'Subsecuencias', [-1]: 'Cuentas con problemas', [-2]: 'Protección de rebotes', [-99]: 'Suspendida',
}
