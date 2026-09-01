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

// Supabase découpe automatiquement les sessions volumineuses en plusieurs
// cookies. Ils doivent rester persistants : supprimer un de ces fragments
// déconnecte l'utilisateur au prochain chargement.
const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(url!, publishableKey!, {
    isSingleton: true,
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      maxAge: AUTH_COOKIE_MAX_AGE,
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Type-safe : renvoie null si non configuré — le jeu n'est jamais bloqué. */
export type SupabaseClient = ReturnType<typeof getSupabaseBrowser>;
