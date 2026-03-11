// ============================================================
// VOTE MIGRATION API — One-time migration of anonymous votes to user account
// POST /api/vote/migrate { voter_id, user_id } → links anonymous votes + creates bookmarks
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "DB not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { voter_id, user_id } = body;
  if (!voter_id || !user_id) {
    return Response.json({ error: "Missing voter_id or user_id" }, { status: 400 });
  }

  // 1. Update all anonymous votes to link them to the user
  const { error: updateError, count: updatedCount } = await supabase
    .from("discovery_votes")
    .update({ user_id })
    .eq("voter_id", voter_id)
    .is("user_id", null)
    .select("*", { count: "exact", head: true });

  if (updateError) {
    console.error(`[VoteMigrate] Update error: ${updateError.message}`);
  }

  // 2. Fetch all votes for this voter_id to create bookmarks
  const { data: votes } = await supabase
    .from("discovery_votes")
    .select("discovery_id")
    .eq("voter_id", voter_id);

  // 3. Create bookmarks for each voted discovery (ignore conflicts)
  let bookmarked = 0;
  if (votes?.length > 0) {
    const bookmarks = votes.map((v) => ({
      user_id,
      discovery_id: v.discovery_id,
    }));
    const { error: bmError } = await supabase
      .from("discovery_bookmarks")
      .upsert(bookmarks, { onConflict: "user_id,discovery_id", ignoreDuplicates: true });
    if (bmError) {
      console.error(`[VoteMigrate] Bookmark upsert error: ${bmError.message}`);
    } else {
      bookmarked = bookmarks.length;
    }
  }

  console.log(`[VoteMigrate] voter=${voter_id} → user=${user_id}: ${votes?.length || 0} votes linked, ${bookmarked} bookmarks created`);

  return Response.json({
    migrated: true,
    votes_linked: votes?.length || 0,
    bookmarks_created: bookmarked,
  });
}
