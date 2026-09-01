import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Client serveur lié explicitement au JWT du navigateur. */
export function getRequestSupabase(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!url || !publishableKey || !authorization?.startsWith("Bearer ")) return null;
  return createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
