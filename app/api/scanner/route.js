// ============================================================
// SCANNER API ROUTE
// GET /api/scanner?secret=...&source=github  → cron-triggered scan
// GET /api/scanner                           → public feed
// GET /api/scanner?source=github             → filtered feed
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { scanGitHub } from "@/lib/scanner/github";
import { scanPyPI } from "@/lib/scanner/pypi";
import { scanHuggingFace } from "@/lib/scanner/huggingface";
import { scanHackerNews } from "@/lib/scanner/hackernews";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
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

    // ── GitHub ──
    if (scanSource === "all" || scanSource === "github") {
      const ghState = stateMap.github || {};
      const { discoveries, newLastEventId } = await scanGitHub(
        process.env.GITHUB_TOKEN,
        ghState.last_event_id
      );

      for (const d of discoveries) {
        await supabase
          .from("scanner_discoveries")
          .upsert(d, { onConflict: "source,external_id" });
      }

      await supabase.from("scanner_state").upsert(
        {
          source: "github",
          last_scan_at: new Date().toISOString(),
          last_event_id: newLastEventId,
          items_found_total:
            (ghState.items_found_total || 0) + discoveries.length,
        },
        { onConflict: "source" }
      );
      results.github = discoveries.length;
    }

    // ── PyPI ──
    if (scanSource === "all" || scanSource === "pypi") {
      const pypiState = stateMap.pypi || {};
      const { discoveries, newLastScanAt } = await scanPyPI(
        pypiState.last_scan_at
      );

      for (const d of discoveries) {
        await supabase
          .from("scanner_discoveries")
          .upsert(d, { onConflict: "source,external_id" });
      }

      await supabase.from("scanner_state").upsert(
        {
          source: "pypi",
          last_scan_at: newLastScanAt,
          last_event_id: null,
          items_found_total:
            (pypiState.items_found_total || 0) + discoveries.length,
        },
        { onConflict: "source" }
      );
      results.pypi = discoveries.length;
    }

    // ── HuggingFace ──
    if (scanSource === "all" || scanSource === "huggingface") {
      const hfState = stateMap.huggingface || {};
      const { discoveries, newLastScanAt } = await scanHuggingFace(
        hfState.last_scan_at
      );

      for (const d of discoveries) {
        await supabase
          .from("scanner_discoveries")
          .upsert(d, { onConflict: "source,external_id" });
      }

      await supabase.from("scanner_state").upsert(
        {
          source: "huggingface",
          last_scan_at: newLastScanAt,
          last_event_id: null,
          items_found_total:
            (hfState.items_found_total || 0) + discoveries.length,
        },
        { onConflict: "source" }
      );
      results.huggingface = discoveries.length;
    }

    // ── Hacker News ──
    if (scanSource === "all" || scanSource === "hackernews") {
      const hnState = stateMap.hackernews || {};
      const { discoveries, newLastItemId } = await scanHackerNews(
        hnState.last_event_id
      );

      for (const d of discoveries) {
        await supabase
          .from("scanner_discoveries")
          .upsert(d, { onConflict: "source,external_id" });
      }

      await supabase.from("scanner_state").upsert(
        {
          source: "hackernews",
          last_scan_at: new Date().toISOString(),
          last_event_id: newLastItemId,
          items_found_total:
            (hnState.items_found_total || 0) + discoveries.length,
        },
        { onConflict: "source" }
      );
      results.hackernews = discoveries.length;
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
    // Return empty feed if DB not configured (works for build)
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
