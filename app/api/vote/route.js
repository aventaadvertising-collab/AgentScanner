// ============================================================
// VOTE API — Anonymous upvoting for scanner discoveries
// POST /api/vote  → toggle vote { discovery_id, voter_id }
// GET  /api/vote?voter_id=xxx → list voted discovery IDs
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// POST — toggle vote on/off
export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "DB not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { discovery_id, voter_id } = body;
  if (!discovery_id || !voter_id) {
    return Response.json({ error: "Missing discovery_id or voter_id" }, { status: 400 });
  }

  // Rate limit: max 100 votes per voter_id (simple abuse prevention)
  const { count } = await supabase
    .from("discovery_votes")
    .select("*", { count: "exact", head: true })
    .eq("voter_id", voter_id);

  if (count && count > 500) {
    return Response.json({ error: "Vote limit reached" }, { status: 429 });
  }

  // Check if vote exists
  const { data: existing } = await supabase
    .from("discovery_votes")
    .select("id")
    .eq("voter_id", voter_id)
    .eq("discovery_id", discovery_id)
    .maybeSingle();

  if (existing) {
    // Remove vote (toggle off)
    await supabase.from("discovery_votes").delete().eq("id", existing.id);
    return Response.json({ voted: false, discovery_id });
  } else {
    // Add vote (toggle on)
    const { error } = await supabase.from("discovery_votes").insert({
      voter_id,
      discovery_id,
    });
    if (error) {
      console.error(`[Vote] Insert error: ${error.message}`);
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ voted: true, discovery_id });
  }
}

// GET — fetch all voted discovery IDs for a voter
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ votes: [] });
  }

  const { searchParams } = new URL(request.url);
  const voter_id = searchParams.get("voter_id");
  if (!voter_id) {
    return Response.json({ votes: [] });
  }

  const { data } = await supabase
    .from("discovery_votes")
    .select("discovery_id")
    .eq("voter_id", voter_id);

  return Response.json({
    votes: (data || []).map((d) => d.discovery_id),
  });
}
