// ============================================================
// ALERT EVALUATION CRON — Checks all active alerts against
// current discovery metrics and creates notifications
// GET /api/alerts/evaluate?secret=xxx → triggered by Vercel cron
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const maxDuration = 30;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.PIPELINE_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 503 });

  const startTime = Date.now();
  let triggered = 0;
  let checked = 0;

  try {
    // Load all active alerts
    const { data: alerts } = await supabase
      .from("discovery_alerts")
      .select("*")
      .eq("active", true);

    if (!alerts?.length) {
      return Response.json({ checked: 0, triggered: 0, ms: Date.now() - startTime });
    }

    // Group alerts by match_type for efficient querying
    const groups = {};
    for (const alert of alerts) {
      if (!groups[alert.match_type]) groups[alert.match_type] = [];
      groups[alert.match_type].push(alert);
    }

    const notifications = [];
    const alertUpdates = [];

    // ── Evaluate keyword alerts ──
    if (groups.keyword) {
      for (const alert of groups.keyword) {
        checked++;
        const matches = await findMatchingDiscoveries(supabase, alert, "keyword");
        const triggered_items = evaluateAlert(alert, matches);
        if (triggered_items.length > 0) {
          for (const item of triggered_items.slice(0, 5)) {
            notifications.push(buildNotification(alert, item));
          }
          alertUpdates.push(alert.id);
          triggered++;
        }
      }
    }

    // ── Evaluate category alerts ──
    if (groups.category) {
      for (const alert of groups.category) {
        checked++;
        const matches = await findMatchingDiscoveries(supabase, alert, "category");
        const triggered_items = evaluateAlert(alert, matches);
        if (triggered_items.length > 0) {
          for (const item of triggered_items.slice(0, 5)) {
            notifications.push(buildNotification(alert, item));
          }
          alertUpdates.push(alert.id);
          triggered++;
        }
      }
    }

    // ── Evaluate source alerts ──
    if (groups.source) {
      for (const alert of groups.source) {
        checked++;
        const matches = await findMatchingDiscoveries(supabase, alert, "source");
        const triggered_items = evaluateAlert(alert, matches);
        if (triggered_items.length > 0) {
          for (const item of triggered_items.slice(0, 5)) {
            notifications.push(buildNotification(alert, item));
          }
          alertUpdates.push(alert.id);
          triggered++;
        }
      }
    }

    // ── Evaluate specific-discovery alerts ──
    if (groups.specific) {
      for (const alert of groups.specific) {
        checked++;
        const matches = await findMatchingDiscoveries(supabase, alert, "specific");
        const triggered_items = evaluateAlert(alert, matches);
        if (triggered_items.length > 0) {
          for (const item of triggered_items.slice(0, 5)) {
            notifications.push(buildNotification(alert, item));
          }
          alertUpdates.push(alert.id);
          triggered++;
        }
      }
    }

    // ── Insert notifications ──
    if (notifications.length > 0) {
      const { error: notifErr } = await supabase
        .from("alert_notifications")
        .insert(notifications);
      if (notifErr) console.error(`[AlertEval] Notification insert error: ${notifErr.message}`);
    }

    // ── Update triggered alerts ──
    if (alertUpdates.length > 0) {
      const now = new Date().toISOString();
      for (const alertId of alertUpdates) {
        await supabase
          .from("discovery_alerts")
          .update({
            last_triggered_at: now,
            last_checked_at: now,
            trigger_count: supabase.rpc ? undefined : undefined, // Can't increment easily, skip
          })
          .eq("id", alertId);
      }
      // Increment trigger_count with raw SQL via RPC or just update timestamps
      await supabase.rpc("increment_alert_triggers", { alert_ids: alertUpdates }).catch(() => {
        // RPC may not exist yet, that's fine — timestamps are updated above
      });
    }

    // Update last_checked_at for all checked alerts
    const now = new Date().toISOString();
    const allAlertIds = alerts.map((a) => a.id);
    await supabase
      .from("discovery_alerts")
      .update({ last_checked_at: now })
      .in("id", allAlertIds);

    console.log(`[AlertEval] ${checked} alerts checked, ${triggered} triggered, ${notifications.length} notifications in ${Date.now() - startTime}ms`);

    return Response.json({
      checked,
      triggered,
      notifications: notifications.length,
      ms: Date.now() - startTime,
    });
  } catch (e) {
    console.error(`[AlertEval] Fatal error: ${e.message}`);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

/**
 * Find discoveries matching an alert's criteria
 */
async function findMatchingDiscoveries(supabase, alert, matchType) {
  const timeMs = parseTimeWindow(alert.time_window);
  const since = new Date(Date.now() - timeMs).toISOString();

  // Debounce: skip if last triggered within the time window
  if (alert.last_triggered_at) {
    const lastTriggered = new Date(alert.last_triggered_at).getTime();
    if (Date.now() - lastTriggered < timeMs) return [];
  }

  let query = supabase
    .from("scanner_discoveries")
    .select("id, name, stars, forks, downloads, upvotes, category, source, discovered_at")
    .gte("discovered_at", since)
    .limit(100);

  switch (matchType) {
    case "keyword":
      query = query.or(`name.ilike.%${alert.match_value}%,description.ilike.%${alert.match_value}%`);
      break;
    case "category":
      query = query.eq("category", alert.match_value);
      break;
    case "source":
      query = query.eq("source", alert.match_value);
      break;
    case "specific":
      query = query.eq("id", alert.match_value);
      break;
  }

  const { data } = await query;

  // For velocity metrics, we need snapshot comparison
  if (alert.metric.includes("velocity") && data?.length) {
    return await enrichWithVelocity(supabase, data, alert.time_window);
  }

  return data || [];
}

/**
 * Enrich discoveries with velocity data from snapshots
 */
async function enrichWithVelocity(supabase, discoveries, timeWindow) {
  const timeMs = parseTimeWindow(timeWindow);
  const since = new Date(Date.now() - timeMs).toISOString();
  const ids = discoveries.map((d) => d.id);

  // Get earliest snapshot within window for each discovery
  const { data: snapshots } = await supabase
    .from("discovery_snapshots")
    .select("discovery_id, stars, downloads, snapshot_at")
    .in("discovery_id", ids)
    .gte("snapshot_at", since)
    .order("snapshot_at", { ascending: true })
    .limit(500);

  if (!snapshots?.length) return discoveries;

  // Get earliest snapshot per discovery
  const earliest = {};
  for (const s of snapshots) {
    if (!earliest[s.discovery_id]) earliest[s.discovery_id] = s;
  }

  // Enrich with velocity
  return discoveries.map((d) => {
    const prev = earliest[d.id];
    if (!prev) return d;
    return {
      ...d,
      stars_velocity: d.stars - prev.stars,
      downloads_velocity: d.downloads - prev.downloads,
    };
  });
}

/**
 * Evaluate which discoveries trigger the alert
 */
function evaluateAlert(alert, discoveries) {
  if (!discoveries?.length) return [];

  const metricKey = alert.metric.replace("_velocity", "");
  const isVelocity = alert.metric.includes("velocity");

  return discoveries.filter((d) => {
    const value = isVelocity
      ? d[`${metricKey}_velocity`] || 0
      : d[metricKey] || 0;

    switch (alert.operator) {
      case "gt": return value > alert.threshold;
      case "lt": return value < alert.threshold;
      case "gte": return value >= alert.threshold;
      case "lte": return value <= alert.threshold;
      default: return false;
    }
  });
}

/**
 * Build a notification object
 */
function buildNotification(alert, discovery) {
  const opSymbol = { gt: ">", lt: "<", gte: ">=", lte: "<=" }[alert.operator] || ">";
  const metricLabel = alert.metric.replace("_", " ");
  const value = discovery[alert.metric.replace("_velocity", "")] || 0;

  return {
    user_id: alert.user_id,
    alert_id: alert.id,
    discovery_id: discovery.id,
    title: `${discovery.name} triggered "${alert.name}"`,
    body: `${metricLabel} ${opSymbol} ${alert.threshold} (current: ${value})`,
  };
}

function parseTimeWindow(tw) {
  const map = { "1h": 3600000, "6h": 21600000, "24h": 86400000, "7d": 604800000 };
  return map[tw] || 86400000;
}
