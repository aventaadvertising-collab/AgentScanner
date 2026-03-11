// ============================================================
// BOOKMARKS API — Persistent auth-linked saves for scanner discoveries
// GET  /api/bookmarks?user_id=xxx → list bookmarked discovery IDs
// POST /api/bookmarks { user_id, discovery_id } → toggle bookmark
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET — fetch all bookmarked discovery IDs for a user
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ bookmarks: [] });
  }

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) {
    return Response.json({ bookmarks: [] });
  }

  const { data } = await supabase
    .from("discovery_bookmarks")
    .select("discovery_id")
    .eq("user_id", user_id);

  return Response.json({
    bookmarks: (data || []).map((d) => d.discovery_id),
  });
}

// POST — toggle bookmark on/off
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

  const { user_id, discovery_id } = body;
  if (!user_id || !discovery_id) {
    return Response.json({ error: "Missing user_id or discovery_id" }, { status: 400 });
  }

  // Check if bookmark exists
  const { data: existing } = await supabase
    .from("discovery_bookmarks")
    .select("id")
    .eq("user_id", user_id)
    .eq("discovery_id", discovery_id)
    .maybeSingle();

  if (existing) {
    // Remove bookmark (toggle off)
    await supabase.from("discovery_bookmarks").delete().eq("id", existing.id);
    return Response.json({ bookmarked: false, discovery_id });
  } else {
    // Add bookmark (toggle on)
    const { error } = await supabase.from("discovery_bookmarks").insert({
      user_id,
      discovery_id,
    });
    if (error) {
      console.error(`[Bookmarks] Insert error: ${error.message}`);
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ bookmarked: true, discovery_id });
  }
}
