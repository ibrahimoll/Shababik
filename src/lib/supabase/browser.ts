import { createBrowserClient } from "@supabase/ssr";

/** Browser client — used only for direct image uploads to Storage (RLS restricts the folder). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
