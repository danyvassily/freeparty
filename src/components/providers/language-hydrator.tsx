"use client";

import { useEffect } from "react";
import { detectBrowserLanguage } from "@/lib/i18n";
import { useLanguageStore } from "@/lib/store/language";

/**
 * Restaure la langue persistée après l'hydratation React. Le HTML initial reste
 * ainsi déterministe tout en respectant ensuite la préférence du navigateur.
 */
export function LanguageHydrator() {
  useEffect(() => {
    const hasPersistedPreference = window.localStorage.getItem("freeparty-language") !== null;

    void Promise.resolve(useLanguageStore.persist.rehydrate()).then(() => {
      if (!hasPersistedPreference) {
        useLanguageStore.getState().setLanguage(detectBrowserLanguage());
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = useLanguageStore.subscribe(({ language }) => {
      document.documentElement.lang = language;
    });
    document.documentElement.lang = useLanguageStore.getState().language;
    return unsubscribe;
  }, []);

  return null;
}
