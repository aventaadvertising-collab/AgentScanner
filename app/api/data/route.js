// ============================================================
// PUBLIC DATA API
// Serves pipeline data to the frontend (no auth needed, public read)
// GET /api/data → all pipeline data
// GET /api/data?source=github → specific source
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request) {
  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");

  let query = supabase.from("pipeline_data").select("product_id, source, data, fetched_at");
  if (source) query = query.eq("source", source);

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Reshape: { [product_id]: { [source]: data } }
  const byProduct = {};
  for (const row of data || []) {
    if (!byProduct[row.product_id]) byProduct[row.product_id] = {};
    byProduct[row.product_id][row.source] = {
      ...row.data,
      _fetched: row.fetched_at,
    };
  }

  return Response.json({
    products: byProduct,
    count: data?.length || 0,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
