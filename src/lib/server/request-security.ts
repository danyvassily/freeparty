import "server-only";

import { createClient } from "@supabase/supabase-js";
export { consumeRateLimit } from "@/lib/server/rate-limit";

export function getRequestClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function consumeAuthenticatedAiQuota(
  request: Request,
): Promise<{ authenticated: boolean; allowed: boolean }> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return { authenticated: false, allowed: false };

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { authenticated: false, allowed: false };

  const { data: allowed, error: quotaError } = await supabase.rpc("consume_ai_question_quota", {
    p_limit: 3,
    p_window_minutes: 10,
  });
  if (quotaError) {
    console.error("[api/questions] quota IA indisponible:", quotaError.message);
    return { authenticated: true, allowed: false };
  }
  return { authenticated: true, allowed: allowed === true };
}
