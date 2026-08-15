/**
 * Free Party — Brand (spec §1 : nom centralisé, aucune chaîne dispersée)
 * Toutes les références au nom du produit passent par ce module.
 */

export const BRAND = {
  name: "Free Party",
  tagline: "Joue. Connais. Débats.",
  shortName: "FreeParty",
  /** Slogan secondaire pour les écrans de chargement */
  loadingMessages: [
    "Préparation des questions…",
    "Mélange des cartes…",
    "Chargement des débats…",
    "Convocation des équipes…",
    "Allumage des confettis…",
  ],
} as const;

export type Brand = typeof BRAND;
