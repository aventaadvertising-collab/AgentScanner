// ============================================================
// COLLECTION ITEMS API — Add/remove discoveries from collections
// GET    /api/collections/items?collection_id=xxx     → list items
// GET    /api/collections/items?user_id=xxx&map=1     → item→collection map
// POST   /api/collections/items { collection_id, discovery_id } → add
// DELETE /api/collections/items { collection_id, discovery_id } → remove
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET — list items in a collection, or get full mapping for a user
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ items: [] });

  const { searchParams } = new URL(request.url);
  const collection_id = searchParams.get("collection_id");
  const user_id = searchParams.get("user_id");
  const wantMap = searchParams.get("map");

  // Full mapping mode: returns { discovery_id: [collection_id, ...] }
  if (user_id && wantMap) {
    const { data } = await supabase
      .from("discovery_collection_items")
      .select("collection_id, discovery_id, discovery_collections!inner(user_id)")
      .eq("discovery_collections.user_id", user_id);

    const map = {};
    for (const item of data || []) {
      if (!map[item.discovery_id]) map[item.discovery_id] = [];
      map[item.discovery_id].push(item.collection_id);
    }

    return Response.json({ map });
  }

  // Single collection mode
  if (!collection_id) return Response.json({ items: [] });

  const { data, error } = await supabase
    .from("discovery_collection_items")
    .select("*, scanner_discoveries(id, name, category, source, url, stars, downloads, description, discovered_at)")
    .eq("collection_id", collection_id)
    .order("added_at", { ascending: false });

  if (error) {
    console.error(`[CollectionItems] GET error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ items: data || [] });
}

// POST — add a discovery to a collection (toggle: add if missing, remove if present)
export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { collection_id, discovery_id, notes } = body;
  if (!collection_id || !discovery_id) {
    return Response.json({ error: "Missing collection_id or discovery_id" }, { status: 400 });
  }

  // Check if already exists (toggle behavior)
  const { data: existing } = await supabase
    .from("discovery_collection_items")
    .select("id")
    .eq("collection_id", collection_id)
    .eq("discovery_id", discovery_id)
    .maybeSingle();

  if (existing) {
    // Remove (toggle off)
    await supabase.from("discovery_collection_items").delete().eq("id", existing.id);
    return Response.json({ added: false, collection_id, discovery_id });
  }

  // Add (toggle on)
  const { error } = await supabase
    .from("discovery_collection_items")
    .insert({
      collection_id,
      discovery_id,
      notes: notes?.slice(0, 500) || null,
    });

  if (error) {
    console.error(`[CollectionItems] POST error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ added: true, collection_id, discovery_id });
}

// DELETE — explicitly remove a discovery from a collection
export async function DELETE(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { collection_id, discovery_id } = body;
  if (!collection_id || !discovery_id) {
    return Response.json({ error: "Missing collection_id or discovery_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("discovery_collection_items")
    .delete()
    .eq("collection_id", collection_id)
    .eq("discovery_id", discovery_id);

  if (error) {
    console.error(`[CollectionItems] DELETE error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ deleted: true, collection_id, discovery_id });
}
