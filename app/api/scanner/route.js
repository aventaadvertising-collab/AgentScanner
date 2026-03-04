// ============================================================
// SCANNER API ROUTE v3
// GET /api/scanner?secret=...&source=github  → cron-triggered scan
// GET /api/scanner                           → public feed
// 11 sources: github, pypi, huggingface, hackernews, npm, reddit,
//             producthunt, arxiv, github-trending, devto, lobsters
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
import { scanDevTo } from "@/lib/scanner/devto";
import { scanLobsters } from "@/lib/scanner/lobsters";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Batch upsert discoveries (single DB round-trip instead of N)
async function batchUpsert(supabase, discoveries) {
  if (!discoveries.length) return;
  const { error } = await supabase
    .from("scanner_discoveries")
    .upsert(discoveries, { onConflict: "source,external_id" });
  if (error) console.log(`[Scanner] Upsert error: ${error.message}`);
}

// Update scan state watermark
async function updateState(supabase, source, updates) {
  await supabase.from("scanner_state").upsert(
    { source, ...updates },
    { onConflict: "source" }
  );
}

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

    const results = {};
    const scanSource = source || "all";

    try {
      // ── GitHub ──
      if (scanSource === "all" || scanSource === "github") {
        const ghState = stateMap.github || {};
        const { discoveries, newLastEventId } = await scanGitHub(
          process.env.GITHUB_TOKEN,
          ghState.last_event_id
        );
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "github", {
          last_scan_at: new Date().toISOString(),
          last_event_id: newLastEventId,
          items_found_total: (ghState.items_found_total || 0) + discoveries.length,
        });
        results.github = discoveries.length;
      }

      // ── PyPI ──
      if (scanSource === "all" || scanSource === "pypi") {
        const pypiState = stateMap.pypi || {};
        const { discoveries, newLastScanAt } = await scanPyPI(pypiState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "pypi", {
          last_scan_at: newLastScanAt,
          items_found_total: (pypiState.items_found_total || 0) + discoveries.length,
        });
        results.pypi = discoveries.length;
      }

      // ── HuggingFace ──
      if (scanSource === "all" || scanSource === "huggingface") {
        const hfState = stateMap.huggingface || {};
        const { discoveries, newLastScanAt } = await scanHuggingFace(hfState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "huggingface", {
          last_scan_at: newLastScanAt,
          items_found_total: (hfState.items_found_total || 0) + discoveries.length,
        });
        results.huggingface = discoveries.length;
      }

      // ── Hacker News ──
      if (scanSource === "all" || scanSource === "hackernews") {
        const hnState = stateMap.hackernews || {};
        const { discoveries, newLastItemId } = await scanHackerNews(hnState.last_event_id);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "hackernews", {
          last_scan_at: new Date().toISOString(),
          last_event_id: newLastItemId,
          items_found_total: (hnState.items_found_total || 0) + discoveries.length,
        });
        results.hackernews = discoveries.length;
      }

      // ── npm ──
      if (scanSource === "all" || scanSource === "npm") {
        const npmState = stateMap.npm || {};
        const { discoveries, newLastScanAt } = await scanNpm(npmState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "npm", {
          last_scan_at: newLastScanAt,
          items_found_total: (npmState.items_found_total || 0) + discoveries.length,
        });
        results.npm = discoveries.length;
      }

      // ── Reddit ──
      if (scanSource === "all" || scanSource === "reddit") {
        const redditState = stateMap.reddit || {};
        const { discoveries, newLastScanAt } = await scanReddit(redditState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "reddit", {
          last_scan_at: newLastScanAt,
          items_found_total: (redditState.items_found_total || 0) + discoveries.length,
        });
        results.reddit = discoveries.length;
      }

      // ── Product Hunt ──
      if (scanSource === "all" || scanSource === "producthunt") {
        const phState = stateMap.producthunt || {};
        const { discoveries, newLastScanAt } = await scanProductHunt(phState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "producthunt", {
          last_scan_at: newLastScanAt,
          items_found_total: (phState.items_found_total || 0) + discoveries.length,
        });
        results.producthunt = discoveries.length;
      }

      // ── arXiv ──
      if (scanSource === "all" || scanSource === "arxiv") {
        const arxivState = stateMap.arxiv || {};
        const { discoveries, newLastScanAt } = await scanArxiv(arxivState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "arxiv", {
          last_scan_at: newLastScanAt,
          items_found_total: (arxivState.items_found_total || 0) + discoveries.length,
        });
        results.arxiv = discoveries.length;
      }

      // ── GitHub Trending ──
      if (scanSource === "all" || scanSource === "github-trending") {
        const gtState = stateMap["github-trending"] || {};
        const { discoveries, newLastScanAt } = await scanGitHubTrending(gtState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "github-trending", {
          last_scan_at: newLastScanAt,
          items_found_total: (gtState.items_found_total || 0) + discoveries.length,
        });
        results["github-trending"] = discoveries.length;
      }

      // ── Dev.to ──
      if (scanSource === "all" || scanSource === "devto") {
        const devtoState = stateMap.devto || {};
        const { discoveries, newLastScanAt } = await scanDevTo(devtoState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "devto", {
          last_scan_at: newLastScanAt,
          items_found_total: (devtoState.items_found_total || 0) + discoveries.length,
        });
        results.devto = discoveries.length;
      }

      // ── Lobsters ──
      if (scanSource === "all" || scanSource === "lobsters") {
        const lState = stateMap.lobsters || {};
        const { discoveries, newLastScanAt } = await scanLobsters(lState.last_scan_at);
        await batchUpsert(supabase, discoveries);
        await updateState(supabase, "lobsters", {
          last_scan_at: newLastScanAt,
          items_found_total: (lState.items_found_total || 0) + discoveries.length,
        });
        results.lobsters = discoveries.length;
      }
    } catch (err) {
      console.error(`[Scanner] Error in ${scanSource}: ${err.message}`);
      return Response.json({
        success: false,
        source: scanSource,
        error: err.message,
        results,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    console.log(`[Scanner] Scan complete: ${JSON.stringify(results)}`);

    return Response.json({
      success: true,
      source: scanSource,
      results,
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

  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const category = searchParams.get("category");

  let query = supabase
    .from("scanner_discoveries")
    .select("*")
    .order("discovered_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (source) query = query.eq("source", source);
  if (category) query = query.eq("category", category);

  const { data } = await query;

  // Stats
  const now = new Date();
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
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}
