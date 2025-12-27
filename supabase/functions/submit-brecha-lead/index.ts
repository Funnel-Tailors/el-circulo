import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-brecha-api-key',
}

// ============= DEFINITIVE EMOJI MAPPINGS =============

const PAIN_MAP: Record<string, { value: string; score: number }> = {
  '🔗': { value: 'low_budget_clients', score: 15 },
  '💀': { value: 'overworked_underpaid', score: 15 },
  '🕳️': { value: 'no_clients', score: 10 },
  '🔒': { value: 'cant_sell_high_ticket', score: 20 },
  '🌀': { value: 'all_above', score: 25 },
}

const PROFESSION_MAP: Record<string, { value: string; score: number }> = {
  '🎨': { value: 'designer', score: 10 },
  '📸': { value: 'photographer', score: 10 },
  '⚙️': { value: 'automation', score: 15 },
  '✨': { value: 'other_creative', score: 10 },
}

const REVENUE_MAP: Record<string, { value: string; score: number; hardstop: boolean }> = {
  '🌑': { value: 'menos_500', score: 0, hardstop: true },
  '🌒': { value: '500_1500', score: 0, hardstop: true },
  '🌓': { value: '1500_3000', score: 15, hardstop: false },
  '🌔': { value: '3000_6000', score: 20, hardstop: false },
  '🌕': { value: 'mas_6000', score: 25, hardstop: false },
}

const ACQUISITION_MAP: Record<string, { value: string; score: number }> = {
  '⚔️': { value: 'referrals', score: 5 },
  '🌊': { value: 'organic', score: 5 },
  '🔥': { value: 'paid', score: 5 },
  '❄️': { value: 'outreach', score: 5 },
  '🌀': { value: 'no_system', score: 0 },
}

const BUDGET_MAP: Record<string, { value: string; score: number; hardstop: boolean }> = {
  '💧': { value: 'menos_1500', score: 0, hardstop: true },
  '💎': { value: '1500_3000', score: 15, hardstop: false },
  '⚡': { value: '3000_5000', score: 20, hardstop: false },
  '🔮': { value: 'mas_5000', score: 25, hardstop: false },
}

const URGENCY_MAP: Record<string, { value: string; score: number }> = {
  '⚡': { value: 'fast', score: 10 },
  '🌿': { value: 'gradual', score: 5 },
}

const AUTHORITY_MAP: Record<string, { value: string; score: number }> = {
  '👤': { value: 'solo', score: 10 },
  '👥': { value: 'shared', score: 5 },
}

// Parse emoji from text
function parseEmoji(text: string, map: Record<string, any>): { value: string; score: number; hardstop?: boolean } | null {
  if (!text) return null
  for (const emoji of Object.keys(map)) {
    if (text.includes(emoji)) {
      return map[emoji]
    }
  }
  return null
}

// Parse multiple emojis (for acquisition Q4)
function parseMultipleEmojis(text: string, map: Record<string, { value: string; score: number }>): { values: string[]; totalScore: number } {
  if (!text) return { values: [], totalScore: 0 }
  const values: string[] = []
  let totalScore = 0
  for (const emoji of Object.keys(map)) {
    if (text.includes(emoji)) {
      values.push(map[emoji].value)
      totalScore += map[emoji].score
    }
  }
  return { values, totalScore }
}

// Determine tier based on budget and score
function determineTier(budgetValue: string, score: number): string {
  // Premium: budget >= 3000 and high score
  if ((budgetValue === '3000_5000' || budgetValue === 'mas_5000') && score >= 90) {
    return 'premium'
  }
  // Full access: qualified leads
  if (score >= 60) {
    return 'full_access'
  }
  // Offer only: lower scores but qualified
  return 'offer_only'
}

// Generate tags based on qualification
function generateTags(
  isQualified: boolean,
  tier: string,
  painValue: string,
  professionValue: string,
  revenueValue: string,
  budgetValue: string,
  urgencyValue: string,
  hardstopReason: string | null
): { toApply: string[]; toRemove: string[] } {
  const toApply: string[] = []
  const toRemove: string[] = []

  if (isQualified) {
    toApply.push('brecha:qualified')
    toApply.push(`brecha:tier_${tier}`)
    toRemove.push('brecha:hardstop', 'brecha:pending')
  } else {
    toApply.push('brecha:hardstop')
    if (hardstopReason) {
      toApply.push(`brecha:hardstop_${hardstopReason}`)
    }
    toRemove.push('brecha:qualified', 'brecha:pending')
  }

  // Segmentation tags
  if (painValue) toApply.push(`brecha:pain_${painValue}`)
  if (professionValue) toApply.push(`brecha:profession_${professionValue}`)
  if (revenueValue) toApply.push(`brecha:revenue_${revenueValue}`)
  if (budgetValue) toApply.push(`brecha:budget_${budgetValue}`)
  if (urgencyValue) toApply.push(`brecha:urgency_${urgencyValue}`)

  return { toApply, toRemove }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-brecha-api-key')
    const expectedKey = Deno.env.get('BRECHA_API_KEY')

    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    console.log('Received payload:', JSON.stringify(body, null, 2))

    const {
      ghl_contact_id,
      first_name,
      pain_answer,
      profession_answer,
      revenue_answer,
      acquisition_answer,
      budget_answer,
      urgency_answer,
      authority_answer,
    } = body

    if (!ghl_contact_id) {
      return new Response(
        JSON.stringify({ error: 'Missing ghl_contact_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse all answers
    const painParsed = parseEmoji(pain_answer || '', PAIN_MAP)
    const professionParsed = parseEmoji(profession_answer || '', PROFESSION_MAP)
    const revenueParsed = parseEmoji(revenue_answer || '', REVENUE_MAP)
    const acquisitionParsed = parseMultipleEmojis(acquisition_answer || '', ACQUISITION_MAP)
    const budgetParsed = parseEmoji(budget_answer || '', BUDGET_MAP)
    const urgencyParsed = parseEmoji(urgency_answer || '', URGENCY_MAP)
    const authorityParsed = parseEmoji(authority_answer || '', AUTHORITY_MAP)

    console.log('Parsed values:', {
      pain: painParsed,
      profession: professionParsed,
      revenue: revenueParsed,
      acquisition: acquisitionParsed,
      budget: budgetParsed,
      urgency: urgencyParsed,
      authority: authorityParsed,
    })

    // Check for hardstops
    let hardstopReason: string | null = null
    
    if (revenueParsed?.hardstop) {
      hardstopReason = 'low_revenue'
      console.log('HARDSTOP: Low revenue detected')
    } else if (budgetParsed?.hardstop) {
      hardstopReason = 'low_budget'
      console.log('HARDSTOP: Low budget detected')
    }

    // Calculate qualification score
    const score = (painParsed?.score || 0) +
                  (professionParsed?.score || 0) +
                  (revenueParsed?.score || 0) +
                  acquisitionParsed.totalScore +
                  (budgetParsed?.score || 0) +
                  (urgencyParsed?.score || 0) +
                  (authorityParsed?.score || 0)

    console.log('Qualification score:', score)

    // Determine if qualified (no hardstop)
    const isQualified = !hardstopReason

    // Determine tier
    const tier = isQualified 
      ? determineTier(budgetParsed?.value || '', score)
      : 'rejected'

    console.log('Qualification result:', { isQualified, tier, hardstopReason })

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upsert lead data
    const { data: leadData, error: upsertError } = await supabase
      .from('brecha_leads')
      .upsert({
        ghl_contact_id,
        first_name: first_name || null,
        pain_answer: painParsed?.value || null,
        profession_answer: professionParsed?.value || null,
        revenue_answer: revenueParsed?.value || null,
        acquisition_answer: acquisitionParsed.values.join(',') || null,
        budget_answer: budgetParsed?.value || null,
        urgency_answer: urgencyParsed?.value || null,
        authority_answer: authorityParsed?.value || null,
        qualification_score: score,
        is_qualified: isQualified,
        tier,
        hardstop_reason: hardstopReason,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'ghl_contact_id',
      })
      .select('token')
      .single()

    if (upsertError) {
      console.error('Error upserting lead:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate URL
    const baseUrl = Deno.env.get('BRECHA_BASE_URL') || 'https://artefacto.tech'
    const brechaUrl = isQualified 
      ? `${baseUrl}/la-brecha?token=${leadData.token}&tier=${tier}`
      : null

    // Generate tags
    const tags = generateTags(
      isQualified,
      tier,
      painParsed?.value || '',
      professionParsed?.value || '',
      revenueParsed?.value || '',
      budgetParsed?.value || '',
      urgencyParsed?.value || '',
      hardstopReason
    )

    const response = {
      success: true,
      qualified: isQualified,
      tier,
      score,
      url: brechaUrl,
      hardstop_reason: hardstopReason,
      tags_to_apply: tags.toApply,
      tags_to_remove: tags.toRemove,
      notification: isQualified 
        ? `✅ ${first_name || 'Lead'} calificado para La Brecha (${tier})`
        : `🚫 ${first_name || 'Lead'} descartado: ${hardstopReason}`,
    }

    console.log('Response:', JSON.stringify(response, null, 2))

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})