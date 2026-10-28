import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Anonymous, cookie-free client for the public website (RLS: public reads only). */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
