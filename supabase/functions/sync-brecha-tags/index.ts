import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tag definitions with emojis
const TAGS = {
  ACCESS: "🚪 brecha_acceso",
  F1_COMPLETE: "✅ f1_completado",
  F2_UNLOCKED: "🔓 f2_desbloqueado",
  F2_COMPLETE: "✅ f2_completado",
  F3_UNLOCKED: "🔓 f3_desbloqueado",
  F3_COMPLETE: "✅ f3_completado",
  F4_UNLOCKED: "🔓 f4_desbloqueado",
  F4_COMPLETE: "✅ f4_completado",
  JOURNEY_COMPLETE: "🏆 brecha_completada",
  DROPS_PERFECT: "💎 drops_perfectos",
  DROPS_MISSED: "❌ drops_perdidos",
  OTO_SHOWN: "👀 oto_vista",
  OTO_CLICK: "🔥 oto_click",
} as const;

interface BrechaProgress {
  frag1_sequence_completed?: boolean;
  frag2_sequence_completed?: boolean;
  frag3_sequence_completed?: boolean;
  frag4_sequence_completed?: boolean;
  portal_traversed?: boolean;
  portal2_traversed?: boolean;
  portal3_traversed?: boolean;
  journey_completed?: boolean;
  skip_the_line_shown?: boolean;
  skip_the_line_clicked?: boolean;
  frag1_drops_missed?: string[];
  frag2_drops_missed?: string[];
  frag3_drops_missed?: string[];
  frag4_drops_missed?: string[];
}

function calculateTags(progress: BrechaProgress): string[] {
  const tags: string[] = [];
  
  // Always add access tag
  tags.push(TAGS.ACCESS);
  
  // Fragment completion tags
  if (progress.frag1_sequence_completed) {
    tags.push(TAGS.F1_COMPLETE);
  }
  
  if (progress.portal_traversed) {
    tags.push(TAGS.F2_UNLOCKED);
  }
  
  if (progress.frag2_sequence_completed) {
    tags.push(TAGS.F2_COMPLETE);
  }
  
  if (progress.portal2_traversed) {
    tags.push(TAGS.F3_UNLOCKED);
  }
  
  if (progress.frag3_sequence_completed) {
    tags.push(TAGS.F3_COMPLETE);
  }
  
  if (progress.portal3_traversed) {
    tags.push(TAGS.F4_UNLOCKED);
  }
  
  if (progress.frag4_sequence_completed) {
    tags.push(TAGS.F4_COMPLETE);
  }
  
  if (progress.journey_completed) {
    tags.push(TAGS.JOURNEY_COMPLETE);
  }
  
  // Drops status - check if any fragment has missed drops
  const hasMissedDrops = [
    progress.frag1_drops_missed,
    progress.frag2_drops_missed,
    progress.frag3_drops_missed,
    progress.frag4_drops_missed,
  ].some(arr => arr && arr.length > 0);
  
  // Only add drops tags if journey is far enough (at least F1 complete)
  if (progress.frag1_sequence_completed) {
    if (hasMissedDrops) {
      tags.push(TAGS.DROPS_MISSED);
    } else {
      tags.push(TAGS.DROPS_PERFECT);
    }
  }
  
  // OTO tags
  if (progress.skip_the_line_shown) {
    tags.push(TAGS.OTO_SHOWN);
  }
  
  if (progress.skip_the_line_clicked) {
    tags.push(TAGS.OTO_CLICK);
  }
  
  return tags;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token) {
      console.error("[sync-brecha-tags] Missing token");
      return new Response(
        JSON.stringify({ error: "Missing token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sync-brecha-tags] Processing token: ${token.substring(0, 8)}...`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get progress from DB
    const { data: progressData, error: progressError } = await supabase
      .from("brecha_progress")
      .select("*")
      .eq("token", token)
      .single();

    if (progressError) {
      console.error("[sync-brecha-tags] Error fetching progress:", progressError);
      return new Response(
        JSON.stringify({ error: "Progress not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get GHL contact ID from brecha_leads
    const { data: leadData, error: leadError } = await supabase
      .from("brecha_leads")
      .select("ghl_contact_id")
      .eq("token", token)
      .single();

    if (leadError || !leadData?.ghl_contact_id) {
      console.error("[sync-brecha-tags] Error fetching lead:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ghlContactId = leadData.ghl_contact_id;
    console.log(`[sync-brecha-tags] GHL Contact ID: ${ghlContactId.substring(0, 8)}...`);

    // Calculate tags based on progress
    const tagsToAdd = calculateTags(progressData);
    console.log(`[sync-brecha-tags] Tags to sync: ${tagsToAdd.join(", ")}`);

    // Update contact in GHL
    const ghlApiToken = Deno.env.get("GHL_API_TOKEN");
    if (!ghlApiToken) {
      console.error("[sync-brecha-tags] Missing GHL_API_TOKEN");
      return new Response(
        JSON.stringify({ error: "GHL configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ghlResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/${ghlContactId}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${ghlApiToken}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28",
        },
        body: JSON.stringify({
          tags: tagsToAdd,
        }),
      }
    );

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      console.error(`[sync-brecha-tags] GHL API error: ${ghlResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to update GHL contact", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ghlResult = await ghlResponse.json();
    console.log(`[sync-brecha-tags] Successfully synced ${tagsToAdd.length} tags`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        tags_synced: tagsToAdd,
        contact_id: ghlContactId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[sync-brecha-tags] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
