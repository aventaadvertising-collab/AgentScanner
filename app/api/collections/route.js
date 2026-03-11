// ============================================================
// COLLECTIONS CRUD API — Organized watchlists
// GET    /api/collections?user_id=xxx       → list user's collections
// POST   /api/collections { ...collection } → create new collection
// PATCH  /api/collections { id, ...fields } → update collection
// DELETE /api/collections { id, user_id }   → delete collection
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET — list all collections for a user (with item counts)
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ collections: [] });

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) return Response.json({ collections: [] });

  const { data, error } = await supabase
    .from("discovery_collections")
    .select("*, discovery_collection_items(count)")
    .eq("user_id", user_id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(`[Collections] GET error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Flatten the count from the nested object
  const collections = (data || []).map((c) => ({
    ...c,
    item_count: c.discovery_collection_items?.[0]?.count || 0,
    discovery_collection_items: undefined,
  }));

  return Response.json({ collections });
}

// POST — create a new collection
export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, name, description, color, icon } = body;
  if (!user_id || !name) return Response.json({ error: "Missing user_id or name" }, { status: 400 });

  const { data, error } = await supabase
    .from("discovery_collections")
    .insert({
      user_id,
      name: name.slice(0, 100),
      description: description?.slice(0, 500) || null,
      color: color || "#2DD4BF",
      icon: icon || "\uD83D\uDCC1",
    })
    .select()
    .single();

  if (error) {
    console.error(`[Collections] POST error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ collection: data }, { status: 201 });
}

// PATCH — update a collection
export async function PATCH(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, user_id, ...updates } = body;
  if (!id || !user_id) return Response.json({ error: "Missing id or user_id" }, { status: 400 });

  const allowed = ["name", "description", "color", "icon", "sort_order"];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  filtered.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("discovery_collections")
    .update(filtered)
    .eq("id", id)
    .eq("user_id", user_id)
    .select()
    .single();

  if (error) {
    console.error(`[Collections] PATCH error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ collection: data });
}

// DELETE — remove a collection (cascades to items)
export async function DELETE(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, user_id } = body;
  if (!id || !user_id) return Response.json({ error: "Missing id or user_id" }, { status: 400 });

  const { error } = await supabase
    .from("discovery_collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) {
    console.error(`[Collections] DELETE error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ deleted: true, id });
}
