/**
 * Free Party — Supabase client (spec §13, §27)
 * LOCAL-FIRST : le jeu fonctionne sans Supabase. Ce client n'est actif
 * que si NEXT_PUBLIC_SUPABASE_URL et la clé anon sont configurées.
 */
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true si Supabase est configuré (persistance optionnelle activée) */
export const isSupabaseConfigured = Boolean(url && anonKey);

export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(url!, anonKey!);
}

/** Type-safe : renvoie null si non configuré — le jeu n'est jamais bloqué. */
export type SupabaseClient = ReturnType<typeof getSupabaseBrowser>;
