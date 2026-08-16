"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useLanguageStore } from "@/lib/store/language";
import { translate, SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "@/lib/i18n";
import type { UILanguage } from "@/lib/i18n";

type AuthView = "login" | "register";

export function AuthForm({ mode: initialMode = "login" }: { mode?: AuthView }) {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const [mode, setMode] = useState<AuthView>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const t = (k: string) => translate(lang, k);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const sb = getSupabaseBrowser();
    if (!sb) {
      setError("Supabase non configuré");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error: err } = await sb.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (data.session) {
          setUser({ id: data.user!.id, email: data.user!.email ?? undefined });
          // Charge le profil (langue, nom)
          const { data: profile } = await sb
            .from("profiles")
            .select("username, avatar_color, language")
            .eq("id", data.user!.id)
            .single();
          // Upsert profil manquant (comptes créés pendant confirmation email)
          if (!profile) {
            await sb.from("profiles").upsert({
              id: data.user!.id,
              username: name || email.split("@")[0],
              avatar_color: 0,
              language: lang,
            });
          }
          if (profile?.language) setLanguage(profile.language as UILanguage);
          // Connecté → direction le salon en ligne (créer ou rejoindre)
          router.push("/play/online");
        } else {
          setError(lang === "fr" ? "Session non établie. Vérifie ton email de confirmation." : "No session. Check your confirmation email.");
        }
      } else {
        const { data, error: err } = await sb.auth.signUp({
          email,
          password,
          options: { data: { username: name || email.split("@")[0] } },
        });
        if (err) throw err;
        if (data.session) {
          // Compte actif immédiatement (confirmation email désactivée)
          await sb.from("profiles").insert({
            id: data.user!.id,
            username: name || email.split("@")[0],
            avatar_color: 0,
            language: lang,
          });
          setUser({ id: data.user!.id, email: data.user!.email ?? undefined });
          router.push("/play/online");
        } else if (data.user) {
          // Confirmation email activée : le compte existe mais il faut confirmer.
          // PAS d'insert profil ici (pas de session → RLS refuserait) — il sera
          // créé au premier login (upsert ci-dessous).
          setError(
            lang === "fr"
              ? `✅ Compte créé ! Un email de confirmation a été envoyé à ${email}. Clique le lien puis reconnecte-toi — ta session restera ensuite active.`
              : `✅ Account created! A confirmation email was sent to ${email}. Click the link, then sign in — your session will then stay active.`,
          );
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes("Invalid login") || msg.includes("invalid_credentials")
        ? t("auth.error.invalid")
        : msg.includes("already") || msg.includes("already_registered")
          ? t("auth.error.exists")
          : msg);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const sb = getSupabaseBrowser();
    await sb?.auth.signOut();
    setUser(null);
    router.push("/");
  }

  if (user) {
    return (
      <div className="fp-card w-full max-w-sm p-6 text-center">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-3 text-sm text-fp-text-dim transition-colors hover:text-white"
        >
          ← {t("config.back")}
        </button>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-fp-success to-fp-accent-2 text-2xl">
          ✓
        </div>
        <h2 className="mt-3 font-display text-xl font-bold">{t("auth.welcome")}</h2>
        <p className="mt-1 text-sm text-fp-text-dim">{user.email}</p>

        {/* Langue de l'interface */}
        <div className="mt-6 text-left">
          <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-400">
            {t("profile.language")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLanguage(l);
                  const sb = getSupabaseBrowser();
                  sb?.from("profiles").update({ language: l }).eq("id", user.id);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  lang === l
                    ? "glass-primary text-white"
                    : "border border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-white"
                }`}
              >
                {LANGUAGE_NAMES[l]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            {lang === "fr" ? "Interface traduite ; catalogue de questions d'élite synchronisé." : "UI translated; question catalog synchronized."}
          </p>
        </div>

        <button type="button" onClick={() => router.push("/settings")} className="glass-button mt-4 w-full rounded-xl py-2.5 text-xs font-medium text-neutral-300">
          {lang === "fr" ? "Réglages (temps de jeu)" : "Settings (game timers)"}
        </button>

        <button type="button" onClick={logout} className="glass-button mt-2.5 w-full rounded-xl py-2.5 text-xs font-medium text-neutral-400 hover:text-white">
          {t("auth.logout")}
        </button>

        <button type="button" onClick={() => router.push("/")} className="glass-primary mt-3 w-full rounded-xl py-3 text-xs font-bold text-white shadow-lg">
          {lang === "fr" ? "Retour au menu" : "Back to home"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="fp-card w-full max-w-sm p-6">
      <h2 className="font-display text-2xl font-bold">{mode === "login" ? t("auth.login") : t("auth.register")}</h2>
      <p className="mt-1 text-sm text-fp-text-dim">
        {mode === "login"
          ? lang === "fr" ? "Retrouve tes infos, ta langue et joue en ligne." : "Get your saved info, language and play online."
          : lang === "fr" ? "Gratuit, 30 secondes. Tes infos sont sauvegardées." : "Free, 30 seconds. Your info is saved."}
      </p>

      {mode === "register" && (
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-fp-text-dim">{t("auth.name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-fp-border bg-fp-surface px-4 py-2.5 font-semibold outline-none focus:border-fp-primary"
            placeholder="Dany"
            maxLength={24}
          />
        </label>
      )}

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-fp-text-dim">{t("auth.email")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-fp-border bg-fp-surface px-4 py-2.5 font-semibold outline-none focus:border-fp-primary"
          placeholder="toi@exemple.fr"
          autoComplete="email"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-fp-text-dim">{t("auth.password")}</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-fp-border bg-fp-surface px-4 py-2.5 font-semibold outline-none focus:border-fp-primary"
          placeholder="••••••••"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>

      {error && <p className="mt-3 rounded-xl bg-fp-danger/10 px-3 py-2 text-sm text-fp-danger">{error}</p>}

      <button type="submit" disabled={loading || !email || password.length < 6} className="fp-btn-primary mt-5 w-full disabled:opacity-40">
        {loading ? "…" : mode === "login" ? t("auth.signIn") : t("auth.signUp")}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-3 w-full text-sm text-fp-text-dim transition-colors hover:text-white"
      >
        {mode === "login"
          ? lang === "fr" ? "Pas de compte ? Crée-en un" : "No account? Create one"
          : lang === "fr" ? "Déjà un compte ? Connecte-toi" : "Already have an account? Sign in"}
      </button>

      {/* Langue rapide */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5 border-t border-fp-border pt-4">
        {SUPPORTED_LANGUAGES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLanguage(l)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              lang === l ? "bg-fp-primary/30 text-white" : "text-fp-text-dim hover:text-white"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </form>
  );
}
