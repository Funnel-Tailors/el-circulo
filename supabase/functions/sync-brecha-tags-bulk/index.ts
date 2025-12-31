import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[sync-brecha-tags-bulk] Starting bulk sync...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all brecha_leads tokens
    const { data: leads, error: leadsError } = await supabase
      .from('brecha_leads')
      .select('token, first_name, ghl_contact_id');

    if (leadsError) {
      console.error('[sync-brecha-tags-bulk] Error fetching leads:', leadsError);
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    if (!leads || leads.length === 0) {
      console.log('[sync-brecha-tags-bulk] No leads found');
      return new Response(
        JSON.stringify({ success: true, total: 0, synced: 0, failed: 0, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-brecha-tags-bulk] Found ${leads.length} leads to sync`);

    const results: Array<{ token: string; name: string; success: boolean; tags?: string[]; error?: string }> = [];
    let synced = 0;
    let failed = 0;

    // Process each lead by calling the sync-brecha-tags function
    for (const lead of leads) {
      try {
        console.log(`[sync-brecha-tags-bulk] Syncing ${lead.first_name || lead.token}...`);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/sync-brecha-tags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ token: lead.token }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          synced++;
          results.push({
            token: lead.token,
            name: lead.first_name || 'Sin nombre',
            success: true,
            tags: result.tags_synced || [],
          });
          console.log(`[sync-brecha-tags-bulk] ✅ Synced ${lead.first_name || lead.token}: ${result.tags_synced?.length || 0} tags`);
        } else {
          failed++;
          results.push({
            token: lead.token,
            name: lead.first_name || 'Sin nombre',
            success: false,
            error: result.error || 'Unknown error',
          });
          console.error(`[sync-brecha-tags-bulk] ❌ Failed ${lead.first_name || lead.token}: ${result.error}`);
        }
      } catch (err) {
        failed++;
        results.push({
          token: lead.token,
          name: lead.first_name || 'Sin nombre',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        console.error(`[sync-brecha-tags-bulk] ❌ Error syncing ${lead.token}:`, err);
      }
    }

    console.log(`[sync-brecha-tags-bulk] Completed: ${synced} synced, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: leads.length,
        synced,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[sync-brecha-tags-bulk] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
