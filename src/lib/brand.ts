/**
 * JOUXTA — Brand (spec §1 : nom centralisé, aucune chaîne dispersée)
 * Toutes les références au nom du produit passent par ce module.
 */

export const BRAND = {
  name: "JOUXTA",
  fullName: "JOUXTA",
  tagline: "Joue. Connais. Débats.",
  shortName: "JOUXTA",
  creator: "dany vassiliakos",
  footerCredits: "JOUXTA designé par dany vassiliakos",
  /** Messages d'attente légers pour les écrans de chargement */
  loadingMessages: [
    "Préparation des questions…",
    "Mélange des catégories…",
    "Dernière vérification…",
  ],
} as const;

export type Brand = typeof BRAND;
