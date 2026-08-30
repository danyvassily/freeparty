/**
 * Free Party — Brand (spec §1 : nom centralisé, aucune chaîne dispersée)
 * Toutes les références au nom du produit passent par ce module.
 */

export const BRAND = {
  name: "Free Party",
  fullName: "Free Party",
  tagline: "Joue. Connais. Débats.",
  shortName: "Free Party",
  /** Messages d'attente légers pour les écrans de chargement */
  loadingMessages: [
    "Préparation des questions…",
    "Mélange des catégories…",
    "Dernière vérification…",
  ],
} as const;

export type Brand = typeof BRAND;
