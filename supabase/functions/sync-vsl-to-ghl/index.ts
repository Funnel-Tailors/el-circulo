import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ghlApiToken = Deno.env.get('GHL_API_TOKEN')!;
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[VSL Sync] Starting VSL to GHL sync process');

    // Get all VSL views with ghl_contact_id that haven't been synced yet
    const { data: vslViews, error: fetchError } = await supabase
      .from('vsl_views')
      .select('*')
      .not('ghl_contact_id', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[VSL Sync] Error fetching VSL views:', fetchError);
      throw fetchError;
    }

    if (!vslViews || vslViews.length === 0) {
      console.log('[VSL Sync] No VSL views to sync');
      return new Response(
        JSON.stringify({ message: 'No VSL views to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[VSL Sync] Found ${vslViews.length} VSL views to process`);

    // Group by ghl_contact_id and get the latest/highest percentage watched
    const contactsMap = new Map<string, typeof vslViews[0]>();
    
    vslViews.forEach(view => {
      const existing = contactsMap.get(view.ghl_contact_id);
      if (!existing || view.video_percentage_watched > existing.video_percentage_watched) {
        contactsMap.set(view.ghl_contact_id, view);
      }
    });

    console.log(`[VSL Sync] Processing ${contactsMap.size} unique contacts`);

    let syncedCount = 0;
    let errorCount = 0;

    // Update each contact in GHL
    for (const [contactId, vslView] of contactsMap.entries()) {
      try {
        console.log(`[VSL Sync] Updating contact ${contactId} with VSL data:`, {
          percentage: vslView.video_percentage_watched,
          duration: vslView.view_duration_seconds,
        });

        const updatePayload = {
          customFields: [
            { key: 'vsl_watched', field_value: vslView.video_percentage_watched > 10 ? 'yes' : 'no' },
            { key: 'vsl_percentage', field_value: vslView.video_percentage_watched.toString() },
            { key: 'vsl_duration', field_value: vslView.view_duration_seconds.toString() },
          ],
        };

        const ghlResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${ghlApiToken}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28',
            },
            body: JSON.stringify(updatePayload),
          }
        );

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          console.error(`[VSL Sync] GHL API error for contact ${contactId}:`, {
            status: ghlResponse.status,
            error: errorText,
          });
          errorCount++;
          continue;
        }

        const ghlData = await ghlResponse.json();
        console.log(`[VSL Sync] Successfully updated contact ${contactId}`, ghlData);
        syncedCount++;

      } catch (error) {
        console.error(`[VSL Sync] Exception updating contact ${contactId}:`, error);
        errorCount++;
      }
    }

    console.log(`[VSL Sync] Sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        message: 'VSL sync completed',
        synced: syncedCount,
        errors: errorCount,
        total: contactsMap.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[VSL Sync] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
