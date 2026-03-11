// ============================================================
// ALERT NOTIFICATIONS API — List & manage in-app notifications
// GET   /api/alerts/notifications?user_id=xxx       → list recent
// PATCH /api/alerts/notifications { id, read: true } → mark read
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET — list recent notifications for a user
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ notifications: [], unread: 0 });

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) return Response.json({ notifications: [], unread: 0 });

  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);

  const [{ data: notifs }, { count: unread }] = await Promise.all([
    supabase
      .from("alert_notifications")
      .select("*, discovery_alerts(name, match_type, metric)")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("alert_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("read", false),
  ]);

  return Response.json({
    notifications: notifs || [],
    unread: unread || 0,
  });
}

// PATCH — mark notification(s) as read
export async function PATCH(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, id, mark_all } = body;
  if (!user_id) return Response.json({ error: "Missing user_id" }, { status: 400 });

  if (mark_all) {
    // Mark all unread as read
    const { error } = await supabase
      .from("alert_notifications")
      .update({ read: true })
      .eq("user_id", user_id)
      .eq("read", false);

    if (error) {
      console.error(`[Notifications] mark_all error: ${error.message}`);
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ marked: "all" });
  }

  if (!id) return Response.json({ error: "Missing id or mark_all" }, { status: 400 });

  const { error } = await supabase
    .from("alert_notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) {
    console.error(`[Notifications] PATCH error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ marked: id });
}
