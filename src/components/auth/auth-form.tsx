"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, User, Mail, Lock, Sparkles, LogOut, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { useLanguageStore } from "@/lib/store/language";
import { translate, SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "@/lib/i18n";
import { PlayerDot } from "@/components/ui/primitives";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";

type AuthView = "register" | "login";

export function AuthForm({ mode: initialMode = "register" }: { mode?: AuthView }) {
  const router = useRouter();
  const { user, isLoggedIn, loading, signUp, signIn, signOut, updateName } = useAuth();
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const [mode, setMode] = useState<AuthView>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const t = (k: string) => translate(lang, k);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (mode === "register") {
        const res = await signUp({
          email,
          password,
          name: name.trim() || email.split("@")[0],
          language: lang,
        });
        if (res.message) {
          setSuccessMessage(res.message);
        } else {
          setSuccessMessage(lang === "fr" ? "Compte créé avec succès ! Vos parties et statistiques sont sauvegardées." : "Account created successfully! Your games and stats are saved.");
          setTimeout(() => {
            router.push("/play/online");
          }, 1200);
        }
      } else {
        await signIn({ email, password });
        setSuccessMessage(lang === "fr" ? "Connexion réussie !" : "Signed in successfully!");
        setTimeout(() => {
          router.push("/play/online");
        }, 800);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid login") || msg.includes("invalid_credentials")) {
        setError(t("auth.error.invalid"));
      } else if (msg.includes("already") || msg.includes("already_registered")) {
        setError(t("auth.error.exists"));
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Si l'utilisateur est déjà connecté avec un compte
  if (!loading && isLoggedIn && user) {
    return (
      <div className="fp-card w-full p-6 text-center animate-rise shadow-md border border-black/[0.04]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-4 flex items-center gap-1 text-[15px] font-medium text-fp-primary hover:underline"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>{t("config.back")}</span>
        </button>

        <div className="mx-auto flex justify-center mb-2">
          <KawaiiMascot theme="party" size={80} className="border border-black/[0.04] shadow-xs" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-fp-success/15 px-3.5 py-1 text-[13px] font-semibold text-fp-success">
          <CheckCircle2 className="h-4 w-4" />
          <span>{lang === "fr" ? "Compte actif & synchronisé" : "Account active & synced"}</span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <PlayerDot name={user.name} colorIndex={0} size={42} />
          <div className="text-left">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="fp-input px-2.5 py-1 text-[16px] font-bold"
                  maxLength={24}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (editedName.trim()) await updateName(editedName);
                    setEditingName(false);
                  }}
                  className="fp-btn-primary px-3 py-1 text-[13px]"
                >
                  OK
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[18px] font-bold text-fp-text flex items-center gap-2">
                  {user.name}
                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(user.name);
                      setEditingName(true);
                    }}
                    className="text-[12px] font-normal text-fp-primary hover:underline"
                  >
                    (modifier)
                  </button>
                </p>
                <p className="text-[13px] text-fp-text-dim">{user.email || "Compte local persistant"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Avantages du compte actif */}
        <div className="mt-6 rounded-2xl bg-black/[0.02] p-4 text-left border border-black/[0.04]">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-fp-text">
            <ShieldCheck className="h-4 w-4 text-fp-success" />
            <span>Historique Anti-Répétition protégé</span>
          </div>
          <p className="mt-1 text-[12px] text-fp-text-dim">
            Toutes vos parties, questions déjà vues et victoires sont conservées sur votre profil et partagées dans les salons multijoueurs.
          </p>
        </div>

        {/* Choix de langue */}
        <div className="mt-5 text-left">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-fp-text-dim">
            {t("profile.language")}
          </p>
          <div className="mt-2 flex gap-2">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition ${
                  lang === l
                    ? "bg-fp-primary text-white shadow-xs"
                    : "bg-black/[0.04] text-fp-text hover:bg-black/[0.07]"
                }`}
              >
                {LANGUAGE_NAMES[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => router.push("/play/online")}
            className="fp-btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-[15px]"
          >
            <span>Jouer en ligne dans un salon</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={signOut}
            className="fp-btn-ghost w-full py-2.5 text-[14px] text-fp-danger flex items-center justify-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("auth.logout")}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fp-card w-full p-6 animate-rise shadow-lg border border-black/[0.04]">
      {/* Navigation de retour */}
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mb-3 flex items-center gap-0.5 text-[14px] font-medium text-fp-primary hover:underline"
      >
        <ChevronLeft className="h-4.5 w-4.5" />
        <span>Accueil</span>
      </button>

      {/* Onglets Création de compte / Connexion */}
      <div className="flex rounded-2xl bg-black/[0.05] p-1 mb-5">
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 rounded-xl py-2.5 text-[14px] font-bold transition-all ${
            mode === "register"
              ? "bg-white text-fp-text shadow-xs"
              : "text-fp-text-dim hover:text-fp-text"
          }`}
        >
          Créer un compte
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 rounded-xl py-2.5 text-[14px] font-bold transition-all ${
            mode === "login"
              ? "bg-white text-fp-text shadow-xs"
              : "text-fp-text-dim hover:text-fp-text"
          }`}
        >
          Se connecter
        </button>
      </div>

      <header className="mb-4">
        <h2 className="text-[22px] font-bold tracking-tight text-fp-text">
          {mode === "register" ? "Créez votre profil joueur" : "Bon retour parmi nous"}
        </h2>
        <p className="mt-1 text-[13px] text-fp-text-dim">
          {mode === "register"
            ? "Conservez vos questions inédites, retrouvez vos amis et sauvegardez vos victoires."
            : "Connectez-vous pour reprendre vos salons et votre historique."}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="block text-[13px] font-semibold text-fp-text-dim mb-1">
              {t("auth.name")} / Pseudo
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4.5 w-4.5 text-fp-text-dim" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="fp-input w-full pl-10 pr-4 py-3 text-[15px]"
                placeholder="Ex : Dany"
                maxLength={24}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[13px] font-semibold text-fp-text-dim mb-1">
            {t("auth.email")}
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4.5 w-4.5 text-fp-text-dim" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fp-input w-full pl-10 pr-4 py-3 text-[15px]"
              placeholder="toi@exemple.fr"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-fp-text-dim mb-1">
            {t("auth.password")} (6 caractères minimum)
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4.5 w-4.5 text-fp-text-dim" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fp-input w-full pl-10 pr-4 py-3 text-[15px]"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
        </div>

        {mode === "register" && (
          <div>
            <span className="block text-[13px] font-semibold text-fp-text-dim mb-1">
              Langue préférée
            </span>
            <div className="flex gap-2">
              {(["fr", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition ${
                    lang === l ? "bg-fp-primary text-white shadow-xs" : "bg-black/[0.04] text-fp-text hover:bg-black/[0.07]"
                  }`}
                >
                  {l === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-fp-danger/10 p-3 text-[13px] font-semibold text-fp-danger animate-shake">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="rounded-xl bg-fp-success/10 p-3 text-[13px] font-semibold text-fp-success animate-rise">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !email || password.length < 6 || (mode === "register" && !name.trim())}
          className="fp-btn-primary mt-3 w-full py-4 text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Sparkles className="h-4.5 w-4.5" />
          <span>
            {submitting
              ? "Patientez…"
              : mode === "register"
                ? "Créer mon compte joueur"
                : "Se connecter"}
          </span>
        </button>
      </form>

      {/* Rassurance / Bénéfices */}
      <div className="mt-6 border-t border-black/[0.05] pt-4 text-center">
        <p className="text-[12px] text-fp-text-dim">
          ✨ 100% gratuit et sans publicité. Vos questions déjà vues sont exclues automatiquement.
        </p>
      </div>
    </div>
  );
}
