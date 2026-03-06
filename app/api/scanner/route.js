// ============================================================
// SCANNER API ROUTE v5 — BATCH PARALLEL + PRODUCT FILTER
// GET /api/scanner?secret=...&source=batch1  → cron-triggered scan
// GET /api/scanner                           → public feed
//
// 3 batch crons, each running sources IN PARALLEL:
//   batch1: github, pypi, huggingface, hackernews (every minute)
//   batch2: npm, reddit, producthunt, arxiv       (every minute)
//   batch3: github-trending, github-momentum, devto, lobsters (every minute)
//
// Also supports: source=all, source=<individual-source>
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { scanGitHub } from "@/lib/scanner/github";
import { scanPyPI } from "@/lib/scanner/pypi";
import { scanHuggingFace } from "@/lib/scanner/huggingface";
import { scanHackerNews } from "@/lib/scanner/hackernews";
import { scanNpm } from "@/lib/scanner/npm";
import { scanReddit } from "@/lib/scanner/reddit";
import { scanProductHunt } from "@/lib/scanner/producthunt";
import { scanArxiv } from "@/lib/scanner/arxiv";
import { scanGitHubTrending } from "@/lib/scanner/github-trending";
import { scanGitHubMomentum } from "@/lib/scanner/github-momentum";
import { scanDevTo } from "@/lib/scanner/devto";
import { scanLobsters } from "@/lib/scanner/lobsters";
import { validateProduct } from "@/lib/scanner/product-filter";

// ── Batch definitions ──
const BATCHES = {
  batch1: ["github", "pypi", "huggingface", "hackernews"],
  batch2: ["npm", "reddit", "producthunt", "arxiv"],
  batch3: ["github-trending", "github-momentum", "devto", "lobsters"],
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function batchUpsert(supabase, discoveries) {
  if (!discoveries.length) return;
  const { error } = await supabase
    .from("scanner_discoveries")
    .upsert(discoveries, { onConflict: "source,external_id" });
  if (error) console.log(`[Scanner] Upsert error: ${error.message}`);
}

async function updateState(supabase, source, updates) {
  await supabase.from("scanner_state").upsert(
    { source, ...updates },
    { onConflict: "source" }
  );
}

// ── Product filter: validate + boost confidence + recency check ──
function filterProducts(discoveries) {
  const products = [];
  let rejected = 0;
  let tooOld = 0;
  const MAX_SOURCE_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

  for (const d of discoveries) {
    // Recency check: skip items created more than 14 days ago at source
    if (d.source_created_at) {
      const age = Date.now() - new Date(d.source_created_at).getTime();
      if (age > MAX_SOURCE_AGE_MS) {
        tooOld++;
        continue;
      }
    }

    const { isProduct, reason, confidenceBoost } = validateProduct(d);
    if (!isProduct) {
      rejected++;
      continue;
    }
    // Apply confidence boost from product signals
    if (confidenceBoost > 0) {
      d.ai_confidence = Math.min((d.ai_confidence || 0) + confidenceBoost, 1);
    }
    products.push(d);
  }

  if (rejected > 0 || tooOld > 0) {
    console.log(`[Scanner] Product filter: ${products.length} products, ${rejected} non-products rejected, ${tooOld} too old`);
  }

  return products;
}

// ── Individual source scanner ──
async function runSource(sourceName, stateMap, supabase) {
  const state = stateMap[sourceName] || {};
  let discoveries = [];
  let stateUpdate = {};

  try {
    switch (sourceName) {
      case "github": {
        const r = await scanGitHub(process.env.GITHUB_TOKEN, state.last_event_id);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: new Date().toISOString(), last_event_id: r.newLastEventId };
        break;
      }
      case "pypi": {
        const r = await scanPyPI(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "huggingface": {
        const r = await scanHuggingFace(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "hackernews": {
        const r = await scanHackerNews(state.last_event_id);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: new Date().toISOString(), last_event_id: r.newLastItemId };
        break;
      }
      case "npm": {
        const r = await scanNpm(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "reddit": {
        const r = await scanReddit(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "producthunt": {
        const r = await scanProductHunt(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "arxiv": {
        const r = await scanArxiv(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "github-trending": {
        const r = await scanGitHubTrending(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "github-momentum": {
        const r = await scanGitHubMomentum(state.last_scan_at, supabase, process.env.GITHUB_TOKEN);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "devto": {
        const r = await scanDevTo(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
      case "lobsters": {
        const r = await scanLobsters(state.last_scan_at);
        discoveries = r.discoveries;
        stateUpdate = { last_scan_at: r.newLastScanAt };
        break;
      }
    }

    // Apply product filter — reject blog posts, discussions, non-products
    const rawCount = discoveries.length;
    discoveries = filterProducts(discoveries);

    // Persist results
    await batchUpsert(supabase, discoveries);
    await updateState(supabase, sourceName, {
      ...stateUpdate,
      items_found_total: (state.items_found_total || 0) + discoveries.length,
    });

    console.log(`[Scanner:${sourceName}] ${rawCount} raw → ${discoveries.length} products saved`);
    return { source: sourceName, count: discoveries.length, raw: rawCount, ok: true };
  } catch (err) {
    console.error(`[Scanner:${sourceName}] Error: ${err.message}`);
    return { source: sourceName, count: 0, ok: false, error: err.message };
  }
}

export const maxDuration = 55; // Vercel Pro: up to 60s

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const source = searchParams.get("source");

  // ─── CRON MODE: secret present → run scanner ───
  if (secret) {
    if (secret !== process.env.PIPELINE_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: "DB not configured" }, { status: 503 });
    }

    // Load scan state (watermarks)
    const { data: states } = await supabase.from("scanner_state").select("*");
    const stateMap = Object.fromEntries(
      (states || []).map((s) => [s.source, s])
    );

    // Determine which sources to scan
    let sourcesToScan = [];
    const scanSource = source || "all";

    if (BATCHES[scanSource]) {
      sourcesToScan = BATCHES[scanSource];
    } else if (scanSource === "all") {
      sourcesToScan = Object.values(BATCHES).flat();
    } else {
      sourcesToScan = [scanSource];
    }

    // Run all selected sources IN PARALLEL
    const scanResults = await Promise.allSettled(
      sourcesToScan.map((s) => runSource(s, stateMap, supabase))
    );

    // Collect results
    const results = {};
    const errors = [];
    let totalRaw = 0;
    for (const r of scanResults) {
      if (r.status === "fulfilled") {
        results[r.value.source] = r.value.count;
        totalRaw += r.value.raw || 0;
        if (!r.value.ok) errors.push(r.value.error);
      }
    }

    const totalFound = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`[Scanner] ${scanSource}: ${totalFound} products from ${totalRaw} raw (${sourcesToScan.length} sources)`);

    return Response.json({
      success: errors.length === 0,
      source: scanSource,
      results,
      total: totalFound,
      raw_scanned: totalRaw,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── TRIGGER MODE: client-initiated scan (no secret needed, rate-limited) ───
  const trigger = searchParams.get("trigger");
  if (trigger) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ triggered: false, reason: "db" });
    }

    // Check staleness — only scan if last scan was > 2 minutes ago
    const { data: latestState } = await supabase
      .from("scanner_state")
      .select("last_scan_at")
      .order("last_scan_at", { ascending: false })
      .limit(1);

    const lastScan = latestState?.[0]?.last_scan_at;
    const staleMins = lastScan
      ? (Date.now() - new Date(lastScan).getTime()) / 60000
      : 999;

    if (staleMins < 2) {
      return Response.json({ triggered: false, reason: "fresh", last_scan_mins_ago: Math.round(staleMins * 10) / 10 });
    }

    // Stale — pick which batch to run (rotate based on minute)
    const minute = new Date().getMinutes();
    const batchKey = ["batch1", "batch2", "batch3"][minute % 3];
    const sourcesToScan = BATCHES[batchKey];

    const { data: states } = await supabase.from("scanner_state").select("*");
    const stateMap = Object.fromEntries((states || []).map((s) => [s.source, s]));

    const scanResults = await Promise.allSettled(
      sourcesToScan.map((s) => runSource(s, stateMap, supabase))
    );

    const results = {};
    for (const r of scanResults) {
      if (r.status === "fulfilled") results[r.value.source] = r.value.count;
    }
    const total = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`[Scanner:trigger] ${batchKey}: ${total} products`);

    return Response.json({
      triggered: true,
      batch: batchKey,
      results,
      total,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── FEED MODE: no secret → return discoveries ───
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({
      discoveries: [],
      stats: { today: 0, this_hour: 0 },
      timestamp: new Date().toISOString(),
    });
  }

  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 300);
  const offset = parseInt(searchParams.get("offset") || "0");
  const category = searchParams.get("category");
  const fresh = searchParams.get("fresh");

  // Default: show items from last 48h for freshness. Fall back to wider window if sparse.
  const now = new Date();
  const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("scanner_discoveries")
    .select("*")
    .order("discovered_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply freshness filter — prioritize recent items
  if (fresh) {
    query = query.gte("discovered_at", twoDaysAgo);
  }

  if (source) query = query.eq("source", source);
  if (category) query = query.eq("category", category);

  let { data } = await query;

  // If fresh filter returned too few results, widen to 7 days
  if (fresh && (!data || data.length < 20)) {
    let widerQuery = supabase
      .from("scanner_discoveries")
      .select("*")
      .gte("discovered_at", weekAgo)
      .order("discovered_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (source) widerQuery = widerQuery.eq("source", source);
    if (category) widerQuery = widerQuery.eq("category", category);
    const wider = await widerQuery;
    if (wider.data && wider.data.length > (data?.length || 0)) {
      data = wider.data;
    }
  }

  // Stats (reuse `now` from above)
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();

  const [todayRes, hourRes] = await Promise.allSettled([
    supabase
      .from("scanner_discoveries")
      .select("*", { count: "exact", head: true })
      .gte("discovered_at", dayAgo),
    supabase
      .from("scanner_discoveries")
      .select("*", { count: "exact", head: true })
      .gte("discovered_at", hourAgo),
  ]);

  const today = todayRes.status === "fulfilled" ? todayRes.value.count || 0 : 0;
  const thisHour = hourRes.status === "fulfilled" ? hourRes.value.count || 0 : 0;

  return Response.json(
    {
      discoveries: data || [],
      stats: { today, this_hour: thisHour },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
