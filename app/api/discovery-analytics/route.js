// ============================================================
// DISCOVERY ANALYTICS API
// Returns sparkline data, velocity, and growth metrics
// GET /api/discovery-analytics?ids=uuid1,uuid2,...  → batch mode
// GET /api/discovery-analytics?id=uuid              → single with full sparklines
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ analytics: {} }, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  }

  const { searchParams } = new URL(request.url);
  const singleId = searchParams.get("id");
  const batchIds = searchParams.get("ids");

  // ── Single mode: full sparkline data for one discovery ──
  if (singleId) {
    const analytics = await getFullAnalytics(supabase, singleId);
    return Response.json(analytics, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  }

  // ── Batch mode: velocity + growth for multiple discoveries ──
  if (batchIds) {
    const ids = batchIds.split(",").slice(0, 50); // Cap at 50
    const analytics = await getBatchAnalytics(supabase, ids);
    return Response.json({ analytics }, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  }

  return Response.json({ error: "Provide ?id=uuid or ?ids=uuid1,uuid2,..." }, { status: 400 });
}

/**
 * Full analytics for a single discovery — includes sparkline arrays
 */
async function getFullAnalytics(supabase, discoveryId) {
  // Get hourly snapshots for the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: snapshots } = await supabase
    .from("discovery_snapshots")
    .select("stars, forks, downloads, upvotes, snapshot_at")
    .eq("discovery_id", discoveryId)
    .gte("snapshot_at", sevenDaysAgo)
    .order("snapshot_at", { ascending: true })
    .limit(168); // ~7 days of hourly data

  if (!snapshots?.length) {
    return { discovery_id: discoveryId, sparkline: null, velocity: null, growth: null };
  }

  // Build sparkline arrays
  const sparkline = {
    stars: snapshots.map((s) => s.stars),
    downloads: snapshots.map((s) => s.downloads),
    forks: snapshots.map((s) => s.forks),
    upvotes: snapshots.map((s) => s.upvotes),
    timestamps: snapshots.map((s) => s.snapshot_at),
  };

  // Calculate velocity and growth
  const velocity = calcVelocity(snapshots);
  const growth = calcGrowth(snapshots);

  return { discovery_id: discoveryId, sparkline, velocity, growth };
}

/**
 * Batch analytics — just velocity + growth, no full sparklines
 */
async function getBatchAnalytics(supabase, ids) {
  if (!ids.length) return {};

  const now = Date.now();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  // For each discovery, get the earliest and latest snapshot in each window
  // Using a single efficient query
  const { data: snapshots } = await supabase
    .from("discovery_snapshots")
    .select("discovery_id, stars, downloads, upvotes, snapshot_at")
    .in("discovery_id", ids)
    .gte("snapshot_at", sevenDaysAgo)
    .order("snapshot_at", { ascending: true })
    .limit(5000);

  if (!snapshots?.length) return {};

  // Group by discovery_id
  const grouped = {};
  for (const s of snapshots) {
    if (!grouped[s.discovery_id]) grouped[s.discovery_id] = [];
    grouped[s.discovery_id].push(s);
  }

  const analytics = {};
  for (const [id, snaps] of Object.entries(grouped)) {
    if (snaps.length < 2) continue;

    const latest = snaps[snaps.length - 1];
    const earliest = snaps[0];

    // Find ~24h ago snapshot
    const dayAgoTarget = now - 24 * 60 * 60 * 1000;
    const dayAgoSnap = findClosest(snaps, dayAgoTarget);

    // Velocity (absolute change)
    const velocity = {
      stars_24h: dayAgoSnap ? latest.stars - dayAgoSnap.stars : null,
      stars_7d: latest.stars - earliest.stars,
      downloads_7d: latest.downloads - earliest.downloads,
    };

    // Growth (percentage change)
    const growth = {
      stars_pct_7d: earliest.stars > 0
        ? ((latest.stars - earliest.stars) / earliest.stars) * 100
        : null,
      downloads_pct_7d: earliest.downloads > 0
        ? ((latest.downloads - earliest.downloads) / earliest.downloads) * 100
        : null,
    };

    // Mini sparkline (just stars, sampled to 20 points max)
    const step = Math.max(1, Math.floor(snaps.length / 20));
    const miniSparkline = [];
    for (let i = 0; i < snaps.length; i += step) {
      miniSparkline.push(snaps[i].stars);
    }
    if (miniSparkline[miniSparkline.length - 1] !== latest.stars) {
      miniSparkline.push(latest.stars);
    }

    analytics[id] = { velocity, growth, sparkline: miniSparkline };
  }

  return analytics;
}

function calcVelocity(snapshots) {
  if (snapshots.length < 2) return null;
  const latest = snapshots[snapshots.length - 1];
  const earliest = snapshots[0];

  const now = Date.now();
  const dayAgoSnap = findClosest(snapshots, now - 24 * 60 * 60 * 1000);

  return {
    stars_24h: dayAgoSnap ? latest.stars - dayAgoSnap.stars : null,
    stars_7d: latest.stars - earliest.stars,
    downloads_24h: dayAgoSnap ? latest.downloads - dayAgoSnap.downloads : null,
    downloads_7d: latest.downloads - earliest.downloads,
  };
}

function calcGrowth(snapshots) {
  if (snapshots.length < 2) return null;
  const latest = snapshots[snapshots.length - 1];
  const earliest = snapshots[0];

  return {
    stars_pct_7d: earliest.stars > 0
      ? ((latest.stars - earliest.stars) / earliest.stars) * 100
      : null,
    downloads_pct_7d: earliest.downloads > 0
      ? ((latest.downloads - earliest.downloads) / earliest.downloads) * 100
      : null,
  };
}

function findClosest(snapshots, targetTime) {
  let closest = null;
  let closestDiff = Infinity;
  for (const s of snapshots) {
    const diff = Math.abs(new Date(s.snapshot_at).getTime() - targetTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = s;
    }
  }
  return closest;
}
