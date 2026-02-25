import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[sync-senda-tags-bulk] Starting bulk sync...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all senda_progress records
    const { data: progressRecords, error: progressError } = await supabase
      .from('senda_progress')
      .select('ghl_contact_id');

    if (progressError) {
      console.error('[sync-senda-tags-bulk] Error fetching progress:', progressError);
      throw new Error(`Failed to fetch progress: ${progressError.message}`);
    }

    if (!progressRecords || progressRecords.length === 0) {
      console.log('[sync-senda-tags-bulk] No records found');
      return new Response(
        JSON.stringify({ success: true, total: 0, synced: 0, failed: 0, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-senda-tags-bulk] Found ${progressRecords.length} records to sync`);

    const results: Array<{ ghl_contact_id: string; success: boolean; tags?: string[]; error?: string }> = [];
    let synced = 0;
    let failed = 0;

    for (const record of progressRecords) {
      try {
        console.log(`[sync-senda-tags-bulk] Syncing ${record.ghl_contact_id.substring(0, 8)}...`);

        const response = await fetch(`${supabaseUrl}/functions/v1/sync-senda-tags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ ghl_contact_id: record.ghl_contact_id }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          synced++;
          results.push({
            ghl_contact_id: record.ghl_contact_id,
            success: true,
            tags: result.tags_synced || [],
          });
          console.log(`[sync-senda-tags-bulk] ✅ Synced: ${result.tags_synced?.length || 0} tags`);
        } else {
          failed++;
          results.push({
            ghl_contact_id: record.ghl_contact_id,
            success: false,
            error: result.error || 'Unknown error',
          });
          console.error(`[sync-senda-tags-bulk] ❌ Failed: ${result.error}`);
        }
      } catch (err) {
        failed++;
        results.push({
          ghl_contact_id: record.ghl_contact_id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        console.error(`[sync-senda-tags-bulk] ❌ Error:`, err);
      }
    }

    console.log(`[sync-senda-tags-bulk] Completed: ${synced} synced, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, total: progressRecords.length, synced, failed, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[sync-senda-tags-bulk] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
