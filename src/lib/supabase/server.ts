/**
 * Free Party — Supabase server client (persistance optionnelle, spec §13)
 * Usage : côté Server Components / Route Handlers uniquement.
 * Le jeu ne dépend JAMAIS de Supabase (local-first, spec §27).
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseServerConfigured = Boolean(url && publishableKey);

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function getSupabaseServer() {
  if (!isSupabaseServerConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(url!, publishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component — ignoré sans middleware de session
        }
      },
    },
  });
}
