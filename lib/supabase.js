import { createBrowserClient } from "@supabase/ssr";

let client = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("Supabase env vars not set — auth disabled");
    return null;
  }
  client = createBrowserClient(url, key);
  return client;
}
