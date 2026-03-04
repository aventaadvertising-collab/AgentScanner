// ============================================================
// PIPELINE API ROUTE
// GET  /api/pipeline         → run full pipeline
// GET  /api/pipeline?source=github  → run specific source
// Protected by PIPELINE_SECRET env var
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { REGISTRY } from "@/lib/pipeline/registry";
import { fetchGitHubMetrics } from "@/lib/pipeline/github";
import { checkUptime } from "@/lib/pipeline/uptime";
import { fetchTrancoRank, estimateTrafficFromRank, detectTechStack } from "@/lib/pipeline/traffic";
import { getFundingData } from "@/lib/pipeline/funding";
import { scrapeJobCount } from "@/lib/pipeline/jobs";
import { fetchXMetrics } from "@/lib/pipeline/social";

// Use service role key for pipeline writes (bypasses RLS)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request) {
  // Auth check
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.PIPELINE_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const source = searchParams.get("source") || "all";
  const supabase = getSupabaseAdmin();
  const results = {};

  console.log(`[Pipeline] Starting run: source=${source}, products=${REGISTRY.length}`);

  // ---- GITHUB ----
  if (source === "all" || source === "github") {
    const ghToken = process.env.GITHUB_TOKEN;
    results.github = {};
    for (const product of REGISTRY) {
      if (product.github) {
        const data = await fetchGitHubMetrics(product.github.owner, product.github.repo, ghToken);
        results.github[product.id] = data;
        if (data && supabase) {
          await supabase.from("pipeline_data").upsert({
            product_id: product.id,
            source: "github",
            data,
            fetched_at: new Date().toISOString(),
          }, { onConflict: "product_id,source" });
        }
      }
    }
    console.log(`[Pipeline] GitHub: fetched ${Object.keys(results.github).length} repos`);
  }

  // ---- UPTIME ----
  if (source === "all" || source === "uptime") {
    results.uptime = {};
    for (const product of REGISTRY) {
      const data = await checkUptime(product.website);
      results.uptime[product.id] = data;
      if (supabase) {
        // Append to uptime_checks table for history
        await supabase.from("uptime_checks").insert({
          product_id: product.id,
          status: data.status,
          ok: data.ok,
          latency_ms: data.latency_ms,
          checked_at: data.checked_at,
        });
      }
    }
    console.log(`[Pipeline] Uptime: checked ${Object.keys(results.uptime).length} sites`);
  }

  // ---- TRAFFIC ----
  if (source === "all" || source === "traffic") {
    results.traffic = {};
    for (const product of REGISTRY) {
      const rank = await fetchTrancoRank(product.website);
      const estimate = rank ? estimateTrafficFromRank(rank.rank) : null;
      const tech = await detectTechStack(product.website);
      results.traffic[product.id] = { rank, estimate, tech };
      if (supabase) {
        await supabase.from("pipeline_data").upsert({
          product_id: product.id,
          source: "traffic",
          data: { rank, estimate, tech },
          fetched_at: new Date().toISOString(),
        }, { onConflict: "product_id,source" });
      }
      await new Promise(r => setTimeout(r, 300)); // rate limit
    }
    console.log(`[Pipeline] Traffic: estimated ${Object.keys(results.traffic).length} sites`);
  }

  // ---- FUNDING ----
  if (source === "all" || source === "funding") {
    results.funding = {};
    for (const product of REGISTRY) {
      const data = getFundingData(product.id);
      results.funding[product.id] = data;
      if (data && supabase) {
        await supabase.from("pipeline_data").upsert({
          product_id: product.id,
          source: "funding",
          data,
          fetched_at: new Date().toISOString(),
        }, { onConflict: "product_id,source" });
      }
    }
    console.log(`[Pipeline] Funding: loaded ${Object.keys(results.funding).length} records`);
  }

  // ---- JOBS ----
  if (source === "all" || source === "jobs") {
    results.jobs = {};
    for (const product of REGISTRY) {
      if (product.careers) {
        const data = await scrapeJobCount(product.careers);
        results.jobs[product.id] = data;
        if (data && supabase) {
          await supabase.from("pipeline_data").upsert({
            product_id: product.id,
            source: "jobs",
            data,
            fetched_at: new Date().toISOString(),
          }, { onConflict: "product_id,source" });
        }
        await new Promise(r => setTimeout(r, 500)); // be respectful
      }
    }
    console.log(`[Pipeline] Jobs: scraped ${Object.keys(results.jobs).length} career pages`);
  }

  // ---- SOCIAL ----
  if (source === "all" || source === "social") {
    const xToken = process.env.X_BEARER_TOKEN;
    results.social = {};
    for (const product of REGISTRY) {
      if (product.twitter) {
        const data = await fetchXMetrics(product.twitter, xToken);
        results.social[product.id] = data;
        if (data && !data.error && supabase) {
          await supabase.from("pipeline_data").upsert({
            product_id: product.id,
            source: "social",
            data,
            fetched_at: new Date().toISOString(),
          }, { onConflict: "product_id,source" });
        }
        await new Promise(r => setTimeout(r, 200));
      }
    }
    console.log(`[Pipeline] Social: fetched ${Object.keys(results.social).length} profiles`);
  }

  return Response.json({
    success: true,
    source,
    timestamp: new Date().toISOString(),
    summary: Object.fromEntries(
      Object.entries(results).map(([k, v]) => [k, Object.keys(v).length])
    ),
    results,
  });
}
