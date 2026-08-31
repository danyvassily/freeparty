"use client";

/**
 * Free Party — Unified Auth & Profile Management
 * Gère l'authentification (Création de compte, Connexion, Déconnexion),
 * la synchronisation avec Supabase Auth (si configuré) et le mode Local-First.
 * Supporte la photo de profil personnalisée (upload, compression square WebP/JPEG,
 * stockage persistant local et Supabase).
 */
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getOrCreateClientDeviceToken,
  getCachedProfileId,
  setCachedProfileId,
} from "@/lib/anti-repetition/client-identity";
import { useGameStore } from "@/lib/store/game";
import { useLanguageStore } from "@/lib/store/language";
import type { UILanguage } from "@/lib/i18n";

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  isAnonymous: boolean;
  avatarColor: number;
  avatarUrl?: string | null;
  createdAt?: string;
}

const LOCAL_AUTH_KEY = "freeparty_auth_user";

/**
 * Compresse et recadre en carré une image sélectionnée par l'utilisateur
 * (format WebP 256x256 léger < 35 Ko)
 */
export async function compressProfilePhoto(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Le fichier doit être une image."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        const targetDim = Math.min(maxSize, minDim);
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetDim, targetDim);
        try {
          const webp = canvas.toDataURL("image/webp", 0.85);
          resolve(webp);
        } catch {
          const jpeg = canvas.toDataURL("image/jpeg", 0.85);
          resolve(jpeg);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const players = useGameStore((s) => s.players);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  // Initialisation et écoute de l'état d'authentification
  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabaseBrowser();
      if (sb && isSupabaseConfigured) {
        const { data } = await sb.auth.getUser();
        if (data.user) {
          const authUserId = data.user.id;
          const email = data.user.email;
          const metadata = data.user.user_metadata ?? {};

          // Récupérer le profil Supabase
          const { data: prof } = await sb
            .from("player_profiles")
            .select("*")
            .eq("user_id", authUserId)
            .single();

          const name = prof?.nickname || metadata.username || metadata.name || email?.split("@")[0] || "Joueur";
          const avatarColor = prof?.avatar_color ?? 0;
          const avatarUrl = metadata.avatar_url || prof?.avatar_url || null;

          const activeUser: AuthUser = {
            id: prof?.id || authUserId,
            email,
            name,
            isAnonymous: false,
            avatarColor,
            avatarUrl,
            createdAt: data.user.created_at,
          };

          setUser(activeUser);
          setCachedProfileId(activeUser.id);
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(activeUser));
          setLoading(false);
          return;
        }
      }

      // Mode Local-First / Hors-ligne
      const cached = localStorage.getItem(LOCAL_AUTH_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as AuthUser;
          setUser(parsed);
          setCachedProfileId(parsed.id);
          setLoading(false);
          return;
        } catch {
          // parse error
        }
      }

      // Utilisateur Anonyme par défaut
      const deviceToken = getOrCreateClientDeviceToken();
      const cachedProfId = getCachedProfileId();
      const currentName = players[0]?.name || "Joueur";
      const currentAvatar = players[0]?.avatarUrl || null;

      setUser({
        id: cachedProfId || `anon_${deviceToken.slice(0, 12)}`,
        name: currentName,
        isAnonymous: true,
        avatarColor: 0,
        avatarUrl: currentAvatar,
      });
    } catch (err) {
      console.error("[useAuth] Erreur lors du chargement:", err);
    } finally {
      setLoading(false);
    }
  }, [players]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (mounted) await refreshUser();
    };
    init();

    const sb = getSupabaseBrowser();
    if (sb && isSupabaseConfigured) {
      const { data: sub } = sb.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          refreshUser();
        }
      });
      return () => {
        mounted = false;
        sub.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  /**
   * Création d'un nouveau compte (Inscription)
   */
  const signUp = async (params: {
    email: string;
    password: string;
    name: string;
    avatarUrl?: string | null;
    language?: UILanguage;
  }): Promise<{ user: AuthUser; message?: string }> => {
    const { email, password, name, avatarUrl, language = "fr" } = params;
    const cleanName = name.trim().slice(0, 24) || email.split("@")[0];
    const previousAnonymousProfileId = getCachedProfileId();
    const deviceToken = getOrCreateClientDeviceToken();

    const sb = getSupabaseBrowser();
    if (sb && isSupabaseConfigured) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanName,
            language,
            avatar_url: avatarUrl ?? undefined,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const userId = data.user.id;

        // Liaison du profil et fusion d'historique via l'API
        try {
          const res = await fetch("/api/identity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "link_user",
              userId,
              currentAnonymousProfileId: previousAnonymousProfileId ?? undefined,
              nickname: cleanName,
            }),
          });
          if (res.ok) {
            const result = await res.json();
            if (result.profile?.id) {
              setCachedProfileId(result.profile.id);
            }
          }
        } catch {
          // best-effort
        }

        const newUser: AuthUser = {
          id: userId,
          email,
          name: cleanName,
          isAnonymous: false,
          avatarColor: 0,
          avatarUrl: avatarUrl ?? null,
          createdAt: data.user.created_at,
        };

        if (data.session) {
          setUser(newUser);
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(newUser));
        }

        // Met à jour le nom et l'avatar dans le store de jeu
        const updatedPlayers = players.map((p, i) =>
          i === 0 ? { ...p, name: cleanName, avatarUrl: avatarUrl || undefined } : p,
        );
        setPlayers(updatedPlayers);
        if (language) setLanguage(language);

        return {
          user: newUser,
          message: data.session
            ? undefined
            : language === "fr"
              ? `Compte créé ! Un email de confirmation a été envoyé à ${email}.`
              : `Account created! A confirmation email was sent to ${email}.`,
        };
      }
    }

    // Création locale instantanée (Local-First)
    const localUserId = `user_${Date.now()}`;
    const newUser: AuthUser = {
      id: localUserId,
      email,
      name: cleanName,
      isAnonymous: false,
      avatarColor: 0,
      avatarUrl: avatarUrl ?? null,
      createdAt: new Date().toISOString(),
    };

    // Fusion de l'historique anti-répétition en local
    try {
      await fetch("/api/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "link_user",
          userId: localUserId,
          currentAnonymousProfileId: previousAnonymousProfileId ?? undefined,
          nickname: cleanName,
        }),
      });
    } catch {
      // local fallback
    }

    setUser(newUser);
    setCachedProfileId(localUserId);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(newUser));
    localStorage.setItem(`freeparty_device_${deviceToken}`, localUserId);

    const updatedPlayers = players.map((p, i) =>
      i === 0 ? { ...p, name: cleanName, avatarUrl: avatarUrl || undefined } : p,
    );
    setPlayers(updatedPlayers);
    if (language) setLanguage(language);

    return { user: newUser };
  };

  /**
   * Connexion à un compte existant
   */
  const signIn = async (params: { email: string; password: string }): Promise<AuthUser> => {
    const { email, password } = params;
    const previousAnonymousProfileId = getCachedProfileId();

    const sb = getSupabaseBrowser();
    if (sb && isSupabaseConfigured) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Erreur de connexion");

      const userId = data.user.id;
      const metadata = data.user.user_metadata ?? {};
      const name = metadata.username || metadata.name || email.split("@")[0];
      const avatarUrl = metadata.avatar_url || null;

      // Fusionne l'historique de l'appareil avec le compte connecté
      try {
        await fetch("/api/identity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "link_user",
            userId,
            currentAnonymousProfileId: previousAnonymousProfileId ?? undefined,
            nickname: name,
          }),
        });
      } catch {
        // best effort
      }

      const activeUser: AuthUser = {
        id: userId,
        email,
        name,
        isAnonymous: false,
        avatarColor: 0,
        avatarUrl,
        createdAt: data.user.created_at,
      };

      setUser(activeUser);
      setCachedProfileId(userId);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(activeUser));

      const updatedPlayers = players.map((p, i) =>
        i === 0 ? { ...p, name, avatarUrl: avatarUrl || undefined } : p,
      );
      setPlayers(updatedPlayers);

      return activeUser;
    }

    // Connexion locale
    const cached = localStorage.getItem(LOCAL_AUTH_KEY);
    let activeUser: AuthUser;
    if (cached) {
      activeUser = JSON.parse(cached);
      activeUser.email = email;
    } else {
      activeUser = {
        id: `user_${Date.now()}`,
        email,
        name: email.split("@")[0],
        isAnonymous: false,
        avatarColor: 0,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      };
    }

    setUser(activeUser);
    setCachedProfileId(activeUser.id);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(activeUser));
    return activeUser;
  };

  /**
   * Déconnexion
   */
  const signOut = async (): Promise<void> => {
    const sb = getSupabaseBrowser();
    if (sb && isSupabaseConfigured) {
      await sb.auth.signOut();
    }

    localStorage.removeItem(LOCAL_AUTH_KEY);
    const deviceToken = getOrCreateClientDeviceToken();
    const anonId = `anon_${deviceToken.slice(0, 12)}`;
    setCachedProfileId(anonId);

    setUser({
      id: anonId,
      name: "Joueur",
      isAnonymous: true,
      avatarColor: 0,
      avatarUrl: null,
    });
  };

  /**
   * Mise à jour du pseudo / nom d'affichage
   */
  const updateName = async (newName: string): Promise<void> => {
    const clean = newName.trim().slice(0, 24) || "Joueur";
    if (!user) return;

    const sb = getSupabaseBrowser();
    if (sb && isSupabaseConfigured && !user.isAnonymous) {
      await sb.auth.updateUser({ data: { username: clean } });
      await sb.from("player_profiles").update({ nickname: clean }).eq("id", user.id);
    }

    const updatedUser = { ...user, name: clean };
    setUser(updatedUser);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(updatedUser));

    const updatedPlayers = players.map((p, i) => (i === 0 ? { ...p, name: clean } : p));
    setPlayers(updatedPlayers);
  };

  /**
   * Mise à jour de la photo de profil (upload/dataURL)
   */
  const updateAvatar = async (avatarUrl: string | null): Promise<void> => {
    if (!user) return;

    const sb = getSupabaseBrowser();
    if (sb && isSupabaseConfigured && !user.isAnonymous) {
      await sb.auth.updateUser({ data: { avatar_url: avatarUrl } });
      await sb.from("player_profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    }

    const updatedUser = { ...user, avatarUrl };
    setUser(updatedUser);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(updatedUser));

    const updatedPlayers = players.map((p, i) =>
      i === 0 ? { ...p, avatarUrl: avatarUrl || undefined } : p,
    );
    setPlayers(updatedPlayers);
  };

  return {
    user,
    loading,
    isLoggedIn: user !== null && !user.isAnonymous,
    signUp,
    signIn,
    signOut,
    updateName,
    updateAvatar,
    refreshUser,
  };
}
