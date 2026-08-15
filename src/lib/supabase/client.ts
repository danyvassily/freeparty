/**
 * Free Party — Supabase client (spec §13, §27)
 * LOCAL-FIRST : le jeu fonctionne sans Supabase. Ce client n'est actif
 * que si NEXT_PUBLIC_SUPABASE_URL et la clé sont configurées.
 *
 * Clé utilisée : NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (nouveau format
 * Supabase) avec repli sur la legacy anon key.
 */
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true si Supabase est configuré (persistance optionnelle activée) */
export const isSupabaseConfigured = Boolean(url && publishableKey);

export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(url!, publishableKey!);
}

/** Type-safe : renvoie null si non configuré — le jeu n'est jamais bloqué. */
export type SupabaseClient = ReturnType<typeof getSupabaseBrowser>;
