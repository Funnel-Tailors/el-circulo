import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Same tags as brecha — content is identical
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

interface SendaProgress {
  class1_sequence_completed?: boolean;
  class2_sequence_completed?: boolean;
  module3_sequence_completed?: boolean;
  module4_sequence_completed?: boolean;
  vault_unlocked?: boolean;
  module3_unlocked?: boolean;
  module4_unlocked?: boolean;
  journey_completed?: boolean;
  skip_the_line_shown?: boolean;
  skip_the_line_clicked?: boolean;
  class1_drops_missed?: string[];
  class2_drops_missed?: string[];
  module3_drops_missed?: string[];
  module4_drops_missed?: string[];
}

function calculateTags(progress: SendaProgress): string[] {
  const tags: string[] = [];

  // Always add access tag
  tags.push(TAGS.ACCESS);

  // Fragment 1 = Class 1
  if (progress.class1_sequence_completed) {
    tags.push(TAGS.F1_COMPLETE);
  }

  // Fragment 2 = Class 2 (vault)
  if (progress.vault_unlocked) {
    tags.push(TAGS.F2_UNLOCKED);
  }

  if (progress.class2_sequence_completed) {
    tags.push(TAGS.F2_COMPLETE);
  }

  // Fragment 3 = Module 3
  if (progress.module3_unlocked) {
    tags.push(TAGS.F3_UNLOCKED);
  }

  if (progress.module3_sequence_completed) {
    tags.push(TAGS.F3_COMPLETE);
  }

  // Fragment 4 = Module 4
  if (progress.module4_unlocked) {
    tags.push(TAGS.F4_UNLOCKED);
  }

  if (progress.module4_sequence_completed) {
    tags.push(TAGS.F4_COMPLETE);
  }

  if (progress.journey_completed) {
    tags.push(TAGS.JOURNEY_COMPLETE);
  }

  // Drops status
  const hasMissedDrops = [
    progress.class1_drops_missed,
    progress.class2_drops_missed,
    progress.module3_drops_missed,
    progress.module4_drops_missed,
  ].some(arr => arr && arr.length > 0);

  if (progress.class1_sequence_completed) {
    if (hasMissedDrops) {
      tags.push(TAGS.DROPS_MISSED);
    } else {
      tags.push(TAGS.DROPS_PERFECT);
    }
  }

  // OTO / Skip the line
  if (progress.skip_the_line_shown) {
    tags.push(TAGS.OTO_SHOWN);
  }

  if (progress.skip_the_line_clicked) {
    tags.push(TAGS.OTO_CLICK);
  }

  return tags;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ghl_contact_id } = await req.json();

    if (!ghl_contact_id) {
      console.error("[sync-senda-tags] Missing ghl_contact_id");
      return new Response(
        JSON.stringify({ error: "Missing ghl_contact_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sync-senda-tags] Processing: ${ghl_contact_id.substring(0, 8)}...`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get progress from DB
    const { data: progressData, error: progressError } = await supabase
      .from("senda_progress")
      .select("*")
      .eq("ghl_contact_id", ghl_contact_id)
      .single();

    if (progressError) {
      console.error("[sync-senda-tags] Error fetching progress:", progressError);
      return new Response(
        JSON.stringify({ error: "Progress not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate tags based on progress
    const tagsToAdd = calculateTags(progressData);
    console.log(`[sync-senda-tags] Tags to sync: ${tagsToAdd.join(", ")}`);

    // Update contact in GHL
    const ghlApiToken = Deno.env.get("GHL_API_TOKEN");
    if (!ghlApiToken) {
      console.error("[sync-senda-tags] Missing GHL_API_TOKEN");
      return new Response(
        JSON.stringify({ error: "GHL configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ghlResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/${ghl_contact_id}`,
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
      console.error(`[sync-senda-tags] GHL API error: ${ghlResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to update GHL contact", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await ghlResponse.json();
    console.log(`[sync-senda-tags] Successfully synced ${tagsToAdd.length} tags`);

    return new Response(
      JSON.stringify({
        success: true,
        tags_synced: tagsToAdd,
        contact_id: ghl_contact_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[sync-senda-tags] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
