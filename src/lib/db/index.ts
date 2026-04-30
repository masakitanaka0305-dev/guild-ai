// GUILD AI — Optional Supabase client
// Returns null when SUPABASE_URL / SUPABASE_ANON_KEY are not set (mock / CI).

let _client: import("@supabase/supabase-js").SupabaseClient | null = null;

export function getDb(): import("@supabase/supabase-js").SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // Lazy import — avoids bundling when env vars are absent
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  _client = createClient(url, key);
  return _client;
}
