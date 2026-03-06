// ============================================================
// COMMIT ACTIVITY API
// Serves GitHub commit activity data for heatmaps
// GET /api/commit-activity?product_id=cursor   → from pipeline_data
// GET /api/commit-activity?repo=owner/repo     → from cache or GitHub
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { fetchGitHubCommitActivity } from "@/lib/pipeline/github";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ weeks: null, error: "db_not_configured" });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const repo = searchParams.get("repo");

    // Channel 1: Registered product — read from pipeline_data
    if (productId) {
      try {
        const { data, error } = await supabase
          .from("pipeline_data")
          .select("data, fetched_at")
          .eq("product_id", productId)
          .eq("source", "github_activity")
          .single();

        if (error) {
          // PGRST116 = no rows found, that's OK
          if (error.code !== "PGRST116") {
            console.error("[commit-activity] pipeline_data query error:", error.message);
          }
          return Response.json({ weeks: null });
        }

        if (data) {
          return Response.json({
            weeks: data.data?.weeks || null,
            fetched_at: data.fetched_at,
          });
        }
        return Response.json({ weeks: null });
      } catch (err) {
        console.error("[commit-activity] pipeline_data error:", err);
        return Response.json({ weeks: null, error: "pipeline_query_failed" });
      }
    }

    // Channel 2: By repo — check cache first, then GitHub
    if (repo) {
      const repoPath = repo.replace(/^\/+|\/+$/g, "");

      // Check cache
      try {
        const { data: cached, error: cacheErr } = await supabase
          .from("commit_activity_cache")
          .select("data, fetched_at")
          .eq("repo_path", repoPath)
          .single();

        if (cacheErr && cacheErr.code !== "PGRST116") {
          // Table might not exist — log but continue to GitHub
          console.error("[commit-activity] cache query error:", cacheErr.message);
        }

        if (cached) {
          const age = Date.now() - new Date(cached.fetched_at).getTime();
          if (age < CACHE_TTL_MS) {
            return Response.json({
              weeks: cached.data?.weeks || null,
              fetched_at: cached.fetched_at,
              source: "cache",
            });
          }
        }
      } catch (err) {
        console.error("[commit-activity] cache check error:", err);
        // Continue to GitHub fetch
      }

      // Cache miss or stale — fetch from GitHub
      const [owner, name] = repoPath.split("/");
      if (!owner || !name) {
        return Response.json({ weeks: null, error: "invalid_repo_path" });
      }

      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return Response.json({ weeks: null, error: "no_github_token" });
      }

      let activity = null;
      try {
        activity = await fetchGitHubCommitActivity(owner, name, token);
      } catch (err) {
        console.error("[commit-activity] GitHub fetch error:", err);
        return Response.json({ weeks: null, error: "github_fetch_failed" });
      }

      if (activity) {
        // Write to cache (best-effort, don't fail the response)
        try {
          const admin = getSupabaseAdmin();
          if (admin) {
            await admin
              .from("commit_activity_cache")
              .upsert(
                {
                  repo_path: repoPath,
                  data: activity,
                  fetched_at: new Date().toISOString(),
                },
                { onConflict: "repo_path" }
              );
          }
        } catch (err) {
          // Cache write failure is non-critical
          console.error("[commit-activity] cache write error:", err);
        }

        return Response.json({
          weeks: activity.weeks,
          fetched_at: new Date().toISOString(),
          source: "github",
        });
      }

      return Response.json({ weeks: null, error: "no_data_from_github" });
    }

    return Response.json({ weeks: null, error: "provide_product_id_or_repo" });
  } catch (err) {
    // Top-level catch — should never hit this, but prevents 500
    console.error("[commit-activity] Unhandled error:", err);
    return Response.json(
      { weeks: null, error: "internal_error", detail: err?.message || String(err) },
      { status: 200 } // Return 200 so client doesn't get 500
    );
  }
}
