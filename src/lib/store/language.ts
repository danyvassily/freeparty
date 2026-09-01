/**
 * Free Party — Language store (spec §40)
 * Langue d'interface persistée localement ; synchronisée avec le profil
 * Supabase quand l'utilisateur est connecté.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UILanguage } from "@/lib/i18n";

interface LanguageState {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      // Le rendu serveur et le premier rendu client doivent être identiques.
      // La préférence locale est restaurée par LanguageHydrator après montage.
      language: "fr",
      setLanguage: (language) => set({ language }),
    }),
    { name: "freeparty-language", skipHydration: true },
  ),
);
