/**
 * Free Party — Brand (spec §1 : nom centralisé, aucune chaîne dispersée)
 * Toutes les références au nom du produit passent par ce module.
 */

export const BRAND = {
  name: "PRISM",
  fullName: "Free Party — PRISM",
  tagline: "Culture compétitive pour adultes",
  shortName: "PRISM",
  /** Slogan secondaire pour les écrans de chargement */
  loadingMessages: [
    "Alignement du prisme…",
    "Calibrage des questions d'élite…",
    "Préparation du Buzzer…",
    "Tracé de La Ligne…",
    "Synchronisation des finalistes…",
  ],
} as const;

export type Brand = typeof BRAND;
