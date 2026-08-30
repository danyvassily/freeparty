"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
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
          const { data: profile } = await sb
            .from("profiles")
            .select("username, avatar_color, language")
            .eq("id", data.user!.id)
            .single();
          if (!profile) {
            await sb.from("profiles").upsert({
              id: data.user!.id,
              username: name || email.split("@")[0],
              avatar_color: 0,
              language: lang,
            });
          }
          if (profile?.language) setLanguage(profile.language as UILanguage);
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
          await sb.from("profiles").insert({
            id: data.user!.id,
            username: name || email.split("@")[0],
            avatar_color: 0,
            language: lang,
          });
          setUser({ id: data.user!.id, email: data.user!.email ?? undefined });
          router.push("/play/online");
        } else if (data.user) {
          setError(
            lang === "fr"
              ? `Compte créé ! Un email de confirmation a été envoyé à ${email}. Clique le lien puis reconnecte-toi.`
              : `Account created! A confirmation email was sent to ${email}. Click the link, then sign in.`,
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
      <div className="fp-card w-full p-6 text-center">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-4 flex items-center gap-0.5 text-[15px] text-fp-blue"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("config.back")}
        </button>
        <CheckCircle2 className="mx-auto h-12 w-12 text-fp-green" />
        <h2 className="mt-3 text-xl font-bold text-fp-text">{t("auth.welcome")}</h2>
        <p className="mt-1 text-sm text-fp-text-secondary">{user.email}</p>

        {/* Langue de l'interface */}
        <div className="mt-6 text-left">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-fp-text-secondary">
            {t("profile.language")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLanguage(l);
                  const sb = getSupabaseBrowser();
                  sb?.from("profiles").update({ language: l }).eq("id", user.id);
                }}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  lang === l
                    ? "bg-fp-blue text-white"
                    : "bg-fp-gray-6 text-fp-text-secondary hover:bg-fp-gray-5"
                }`}
              >
                {LANGUAGE_NAMES[l]}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={() => router.push("/settings")} className="fp-btn-secondary mt-6 w-full">
          {lang === "fr" ? "Réglages (temps de jeu)" : "Settings (game timers)"}
        </button>

        <button type="button" onClick={logout} className="mt-3 w-full text-[15px] font-medium text-fp-red">
          {t("auth.logout")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="fp-card w-full p-6">
      <h2 className="text-xl font-bold text-fp-text">
        {mode === "login" ? t("auth.login") : t("auth.register")}
      </h2>
      <p className="mt-1 text-sm text-fp-text-secondary">
        {mode === "login"
          ? lang === "fr" ? "Optionnel — le jeu en ligne marche aussi avec un simple pseudo." : "Optional — online play also works with a simple nickname."
          : lang === "fr" ? "Gratuit, 30 secondes. Tes préférences sont sauvegardées." : "Free, 30 seconds. Your preferences are saved."}
      </p>

      {mode === "register" && (
        <label className="mt-5 block">
          <span className="text-[13px] font-semibold text-fp-text-secondary">{t("auth.name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="fp-input mt-1.5"
            placeholder="Dany"
            maxLength={24}
          />
        </label>
      )}

      <label className="mt-4 block">
        <span className="text-[13px] font-semibold text-fp-text-secondary">{t("auth.email")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="fp-input mt-1.5"
          placeholder="toi@exemple.fr"
          autoComplete="email"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-[13px] font-semibold text-fp-text-secondary">{t("auth.password")}</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="fp-input mt-1.5"
          placeholder="••••••••"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>

      {mode === "register" && (
        <div className="mt-4">
          <span className="text-[13px] font-semibold text-fp-text-secondary">
            {lang === "fr" ? "Ta langue" : "Your language"}
          </span>
          <div className="mt-1.5 flex gap-2">
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`flex-1 rounded-xl py-2.5 text-[15px] font-semibold transition-colors ${
                  lang === l ? "bg-fp-blue text-white" : "bg-fp-gray-6 text-fp-text-secondary hover:bg-fp-gray-5"
                }`}
              >
                {l === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-fp-text-secondary">
            {lang === "fr"
              ? "Interface et questions affichées dans ta langue, y compris dans les salons en ligne."
              : "Interface and questions shown in your language, including online rooms."}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-fp-red/10 px-3.5 py-2.5 text-sm font-medium text-fp-red">{error}</p>
      )}

      <button type="submit" disabled={loading || !email || password.length < 6} className="fp-btn-primary mt-5 w-full disabled:opacity-40">
        {loading ? "…" : mode === "login" ? t("auth.signIn") : t("auth.signUp")}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-3 w-full text-[15px] font-medium text-fp-blue"
      >
        {mode === "login"
          ? lang === "fr" ? "Pas de compte ? Crée-en un" : "No account? Create one"
          : lang === "fr" ? "Déjà un compte ? Connecte-toi" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
