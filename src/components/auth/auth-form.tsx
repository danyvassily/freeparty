"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  User,
  Mail,
  Lock,
  Sparkles,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Camera,
  Trash2,
  UploadCloud,
  KeyRound,
  Send,
} from "lucide-react";
import { useAuth, compressProfilePhoto } from "@/lib/auth/use-auth";
import { MIN_ACCOUNT_PASSWORD_LENGTH, validateNewPassword } from "@/lib/auth/password";
import { useLanguageStore } from "@/lib/store/language";
import { translate, SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "@/lib/i18n";
import { PlayerDot } from "@/components/ui/primitives";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";

type AuthView = "register" | "login" | "forgot" | "recovery";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  minimumLength = MIN_ACCOUNT_PASSWORD_LENGTH,
  showMinimum = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minimumLength?: number;
  showMinimum?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-semibold text-fp-text-dim">
        {label}
        {showMinimum ? ` (${minimumLength} caractères minimum)` : ""}
      </label>
      <div className="relative flex items-center">
        <Lock className="absolute left-3.5 h-4.5 w-4.5 text-fp-text-dim" />
        <input
          type="password"
          required
          minLength={minimumLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="fp-input w-full py-3 pl-10 pr-4 text-[15px]"
          placeholder="••••••••"
          autoComplete={autoComplete}
        />
      </div>
    </div>
  );
}

function StatusMessage({ kind, children }: { kind: "error" | "success"; children: string }) {
  return (
    <p
      className={`mt-4 rounded-xl p-3 text-[13px] font-semibold ${
        kind === "error"
          ? "bg-fp-danger/10 text-fp-danger animate-shake"
          : "bg-fp-success/10 text-fp-success animate-rise"
      }`}
    >
      {children}
    </p>
  );
}

export function AuthForm({ mode: initialMode = "register" }: { mode?: AuthView }) {
  const router = useRouter();
  const {
    user,
    isLoggedIn,
    loading,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    changePassword,
    completePasswordRecovery,
    updateName,
    updateAvatar,
  } = useAuth();
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const [mode, setMode] = useState<AuthView>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const t = (k: string) => translate(lang, k);
  const requiredPasswordLength = mode === "register" ? MIN_ACCOUNT_PASSWORD_LENGTH : 6;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, isProfileEdit = false) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadingAvatar(true);
    try {
      const compressed = await compressProfilePhoto(file, 256);
      if (isProfileEdit) {
        await updateAvatar(compressed);
        setSuccessMessage(lang === "fr" ? "Photo de profil mise à jour !" : "Profile picture updated!");
      } else {
        setAvatarPreview(compressed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du traitement de l'image.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setSuccessMessage(
          lang === "fr"
            ? "Si un compte correspond à cette adresse, un lien sécurisé vient d’être envoyé."
            : "If an account matches this address, a secure reset link has been sent.",
        );
        return;
      }

      if (mode === "recovery") {
        const validationError = validateNewPassword(newPassword, passwordConfirmation);
        if (validationError) throw new Error(validationError);
        await completePasswordRecovery(newPassword);
        setSuccessMessage(
          lang === "fr"
            ? "Mot de passe modifié. Votre session reste connectée."
            : "Password updated. Your session remains signed in.",
        );
        setNewPassword("");
        setPasswordConfirmation("");
        setTimeout(() => router.replace("/auth"), 1200);
        return;
      }

      if (mode === "register") {
        const res = await signUp({
          email,
          password,
          name: name.trim() || email.split("@")[0],
          avatarUrl: avatarPreview,
          language: lang,
        });
        if (res.message) {
          setSuccessMessage(res.message);
        } else {
          setSuccessMessage(
            lang === "fr"
              ? "Compte créé avec succès ! Vos parties et statistiques sont sauvegardées."
              : "Account created successfully! Your games and stats are saved.",
          );
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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validateNewPassword(newPassword, passwordConfirmation);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirmation("");
      setEditingPassword(false);
      setSuccessMessage(
        lang === "fr" ? "Mot de passe modifié avec succès." : "Password changed successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "forgot" || mode === "recovery") {
    const isRecovery = mode === "recovery";
    return (
      <div className="fp-card w-full p-6 animate-rise shadow-lg border border-black/[0.04]">
        {!isRecovery && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccessMessage(null);
            }}
            className="mb-4 flex items-center gap-1 text-[15px] font-medium text-fp-primary hover:underline"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>{lang === "fr" ? "Retour à la connexion" : "Back to sign in"}</span>
          </button>
        )}

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-fp-primary/10 text-fp-primary">
          {isRecovery ? <KeyRound className="h-5 w-5" /> : <Send className="h-5 w-5" />}
        </div>
        <h2 className="text-[22px] font-bold tracking-tight text-fp-text">
          {isRecovery
            ? lang === "fr"
              ? "Nouveau mot de passe"
              : "New password"
            : lang === "fr"
              ? "Mot de passe oublié"
              : "Forgot your password?"}
        </h2>
        <p className="mt-1 text-[13px] text-fp-text-dim">
          {isRecovery
            ? lang === "fr"
              ? "Choisissez un mot de passe que vous n’utilisez pas ailleurs."
              : "Choose a password you do not use elsewhere."
            : lang === "fr"
              ? "Saisissez votre email et nous vous enverrons un lien sécurisé."
              : "Enter your email and we will send you a secure reset link."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {isRecovery ? (
            <>
              <PasswordField
                label={lang === "fr" ? "Nouveau mot de passe" : "New password"}
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordField
                label={lang === "fr" ? "Confirmer le mot de passe" : "Confirm password"}
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                autoComplete="new-password"
              />
            </>
          ) : (
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-fp-text-dim">
                {t("auth.email")}
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4.5 w-4.5 text-fp-text-dim" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="fp-input w-full py-3 pl-10 pr-4 text-[15px]"
                  placeholder="toi@exemple.fr"
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          {error && <StatusMessage kind="error">{error}</StatusMessage>}
          {successMessage && <StatusMessage kind="success">{successMessage}</StatusMessage>}

          <button
            type="submit"
            disabled={
              submitting ||
              (!isRecovery && !email) ||
              (isRecovery &&
                (newPassword.length < MIN_ACCOUNT_PASSWORD_LENGTH || !passwordConfirmation))
            }
            className="fp-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-[15px] disabled:opacity-40"
          >
            <KeyRound className="h-4 w-4" />
            {submitting
              ? lang === "fr"
                ? "Patientez…"
                : "Please wait…"
              : isRecovery
                ? lang === "fr"
                  ? "Enregistrer le nouveau mot de passe"
                  : "Save new password"
                : lang === "fr"
                  ? "Envoyer le lien"
                  : "Send reset link"}
          </button>
        </form>
      </div>
    );
  }

  // Si l'utilisateur est déjà connecté avec un compte
  if (!loading && isLoggedIn && user) {
    return (
      <div className="fp-card w-full p-6 text-center animate-rise shadow-md border border-black/[0.04]">
        <div className="mx-auto flex justify-center mb-2">
          <KawaiiMascot theme="party" size={72} className="border border-black/[0.04] shadow-xs" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-fp-success/15 px-3.5 py-1 text-[13px] font-semibold text-fp-success">
          <CheckCircle2 className="h-4 w-4" />
          <span>{lang === "fr" ? "Compte actif & synchronisé" : "Account active & synced"}</span>
        </div>

        {/* Section Photo de profil & Pseudo */}
        <div className="mt-5 p-4 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Avatar interactif avec bouton upload */}
            <div className="relative group">
              <PlayerDot
                name={user.name}
                avatarUrl={user.avatarUrl}
                colorIndex={0}
                size={74}
              />
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-fp-primary text-white shadow-md transition hover:scale-105 active:scale-95"
                title="Changer la photo"
                aria-label="Changer la photo de profil"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, true)}
              />
            </div>

            <div className="text-center sm:text-left">
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
                  <p className="text-[19px] font-bold text-fp-text flex items-center justify-center sm:justify-start gap-2">
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

              {/* Boutons photo profil */}
              <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-[12px] font-semibold text-fp-primary hover:underline flex items-center gap-1"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>{uploadingAvatar ? "Chargement…" : "Changer la photo"}</span>
                </button>
                {user.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => updateAvatar(null)}
                    className="text-[12px] font-medium text-fp-danger hover:underline flex items-center gap-1 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <p className="mt-4 rounded-xl bg-fp-success/10 p-3 text-[13px] font-semibold text-fp-success animate-rise">
            {successMessage}
          </p>
        )}

        {/* Avantages du compte actif */}
        <div className="mt-4 rounded-2xl bg-black/[0.02] p-4 text-left border border-black/[0.04]">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-fp-text">
            <ShieldCheck className="h-4 w-4 text-fp-success" />
            <span>Historique Anti-Répétition protégé</span>
          </div>
          <p className="mt-1 text-[12px] text-fp-text-dim">
            Toutes vos parties, questions déjà vues et victoires sont conservées sur votre profil et partagées dans les salons multijoueurs.
          </p>
        </div>

        {/* Sécurité du compte */}
        <div className="mt-4 rounded-2xl border border-black/[0.04] bg-black/[0.02] p-4 text-left">
          <button
            type="button"
            onClick={() => {
              setEditingPassword((value) => !value);
              setError(null);
              setSuccessMessage(null);
            }}
            className="flex w-full items-center justify-between gap-3 text-[13px] font-semibold text-fp-text"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-fp-primary" />
              {lang === "fr" ? "Modifier mon mot de passe" : "Change my password"}
            </span>
            <span className="text-fp-primary">{editingPassword ? "−" : "+"}</span>
          </button>

          {editingPassword && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
              <PasswordField
                label={lang === "fr" ? "Mot de passe actuel" : "Current password"}
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                minimumLength={1}
                showMinimum={false}
              />
              <PasswordField
                label={lang === "fr" ? "Nouveau mot de passe" : "New password"}
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordField
                label={lang === "fr" ? "Confirmer le nouveau mot de passe" : "Confirm new password"}
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                autoComplete="new-password"
              />
              <button
                type="submit"
                disabled={
                  submitting ||
                  !currentPassword ||
                  newPassword.length < MIN_ACCOUNT_PASSWORD_LENGTH ||
                  !passwordConfirmation
                }
                className="fp-btn-secondary w-full py-2.5 text-[13px] disabled:opacity-40"
              >
                {submitting
                  ? lang === "fr"
                    ? "Modification…"
                    : "Updating…"
                  : lang === "fr"
                    ? "Enregistrer le mot de passe"
                    : "Save password"}
              </button>
            </form>
          )}
        </div>

        {error && <StatusMessage kind="error">{error}</StatusMessage>}

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
            ? "Ajoutez une photo, conservez vos questions inédites et retrouvez vos amis."
            : "Connectez-vous pour reprendre vos salons et votre historique."}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            {/* Upload de photo lors de l'inscription */}
            <div className="flex items-center gap-3.5 mb-3 p-3 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
              <div className="relative group shrink-0">
                <PlayerDot
                  name={name || "J"}
                  avatarUrl={avatarPreview}
                  colorIndex={0}
                  size={54}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-fp-primary text-white shadow-sm"
                  aria-label="Télécharger une photo de profil"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-fp-text">Photo de profil (optionnel)</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[12px] font-semibold text-fp-primary hover:underline"
                  >
                    {avatarPreview ? "Changer la photo" : "Télécharger une photo"}
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => setAvatarPreview(null)}
                      className="text-[12px] font-medium text-fp-danger hover:underline"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, false)}
              />
            </div>

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
          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setSuccessMessage(null);
              }}
              className="mt-2 text-[12px] font-semibold text-fp-primary hover:underline"
            >
              {lang === "fr" ? "Mot de passe oublié ?" : "Forgot your password?"}
            </button>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-fp-text-dim mb-1">
            {t("auth.password")} ({requiredPasswordLength} caractères minimum)
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4.5 w-4.5 text-fp-text-dim" />
            <input
              type="password"
              required
              minLength={requiredPasswordLength}
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
                    lang === l
                      ? "bg-fp-primary text-white shadow-xs"
                      : "bg-black/[0.04] text-fp-text hover:bg-black/[0.07]"
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
          disabled={
            submitting ||
            !email ||
            password.length < requiredPasswordLength ||
            (mode === "register" && !name.trim())
          }
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
