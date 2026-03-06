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
  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");
  const repo = searchParams.get("repo");

  // Channel 1: Registered product — read from pipeline_data
  if (productId) {
    const { data } = await supabase
      .from("pipeline_data")
      .select("data, fetched_at")
      .eq("product_id", productId)
      .eq("source", "github_activity")
      .single();

    if (data) {
      return Response.json({
        weeks: data.data?.weeks || null,
        fetched_at: data.fetched_at,
      });
    }
    return Response.json({ weeks: null });
  }

  // Channel 2 & 3: Scanner discovery or momentum — check cache first
  if (repo) {
    const repoPath = repo.replace(/^\/+|\/+$/g, "");

    // Check cache
    const { data: cached } = await supabase
      .from("commit_activity_cache")
      .select("data, fetched_at")
      .eq("repo_path", repoPath)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return Response.json({
          weeks: cached.data?.weeks || null,
          fetched_at: cached.fetched_at,
        });
      }
    }

    // Cache miss or stale — fetch from GitHub
    const [owner, name] = repoPath.split("/");
    if (!owner || !name) {
      return Response.json({ weeks: null, error: "Invalid repo path" });
    }

    const token = process.env.GITHUB_TOKEN;
    const activity = await fetchGitHubCommitActivity(owner, name, token);

    if (activity) {
      // Write to cache using admin client
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
          )
          .catch(() => {});
      }

      return Response.json({
        weeks: activity.weeks,
        fetched_at: new Date().toISOString(),
      });
    }

    return Response.json({ weeks: null });
  }

  return Response.json({ error: "Provide product_id or repo" }, { status: 400 });
}
