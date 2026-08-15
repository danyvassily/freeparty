/**
 * Free Party — Language store (spec §40)
 * Langue d'interface persistée localement ; synchronisée avec le profil
 * Supabase quand l'utilisateur est connecté.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectBrowserLanguage, type UILanguage } from "@/lib/i18n";

interface LanguageState {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: detectBrowserLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    { name: "freeparty-language" },
  ),
);
