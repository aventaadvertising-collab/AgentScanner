// ============================================================
// ALERTS CRUD API — Create, read, update, delete alert rules
// GET    /api/alerts?user_id=xxx           → list user's alerts
// POST   /api/alerts { ...alert }          → create new alert
// PATCH  /api/alerts { id, ...fields }     → update alert
// DELETE /api/alerts { id, user_id }       → delete alert
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET — list all alerts for a user
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ alerts: [] });

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) return Response.json({ alerts: [] });

  const { data, error } = await supabase
    .from("discovery_alerts")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`[Alerts] GET error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ alerts: data || [] });
}

// POST — create a new alert rule
export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, name, match_type, match_value, metric, operator, threshold, time_window, notify_in_app, notify_email, webhook_url } = body;

  if (!user_id || !name || !match_type || !match_value || !metric || !operator || threshold == null) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate enums
  const validMatchTypes = ["keyword", "category", "source", "specific"];
  const validMetrics = ["stars", "downloads", "forks", "upvotes", "stars_velocity", "downloads_velocity"];
  const validOperators = ["gt", "lt", "gte", "lte"];
  const validWindows = ["1h", "6h", "24h", "7d"];

  if (!validMatchTypes.includes(match_type)) return Response.json({ error: "Invalid match_type" }, { status: 400 });
  if (!validMetrics.includes(metric)) return Response.json({ error: "Invalid metric" }, { status: 400 });
  if (!validOperators.includes(operator)) return Response.json({ error: "Invalid operator" }, { status: 400 });
  if (time_window && !validWindows.includes(time_window)) return Response.json({ error: "Invalid time_window" }, { status: 400 });

  const { data, error } = await supabase
    .from("discovery_alerts")
    .insert({
      user_id,
      name: name.slice(0, 200),
      match_type,
      match_value: match_value.slice(0, 200),
      metric,
      operator,
      threshold: Number(threshold),
      time_window: time_window || "24h",
      notify_in_app: notify_in_app !== false,
      notify_email: notify_email === true,
      webhook_url: webhook_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error(`[Alerts] POST error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ alert: data }, { status: 201 });
}

// PATCH — update an existing alert
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

  // Only allow updating specific fields
  const allowed = ["name", "match_type", "match_value", "metric", "operator", "threshold", "time_window", "notify_in_app", "notify_email", "webhook_url", "active"];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  filtered.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("discovery_alerts")
    .update(filtered)
    .eq("id", id)
    .eq("user_id", user_id)
    .select()
    .single();

  if (error) {
    console.error(`[Alerts] PATCH error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ alert: data });
}

// DELETE — remove an alert
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
    .from("discovery_alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) {
    console.error(`[Alerts] DELETE error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ deleted: true, id });
}
