/**
 * Free Party — Métadonnées des modes de jeu et libellés de catégories.
 * Source unique pour l'accueil, la configuration et les salons en ligne.
 */
import type { GameMode } from "@/lib/store/game";
import type { QuestionCategory } from "@/lib/questions/schema";

export interface ModeMeta {
  id: GameMode;
  name: string;
  subtitle: string;
  icon: string;
  /** Couleur de la pastille iOS */
  iconBg: string;
  /** Nombre minimal de joueurs */
  minPlayers: number;
  /** Le mode utilise le catalogue de questions (catégorie + nombre) */
  usesQuestionCatalog: boolean;
  /** Le mode se prête au multi-joueurs sur un appareil */
  passAndPlay: boolean;
}

export const MODE_META: Record<GameMode, ModeMeta> = {
  prism: {
    id: "prism",
    name: "Prism",
    subtitle: "Tour par tour, buzzer et finale La Ligne",
    icon: "prism",
    iconBg: "bg-fp-primary",
    minPlayers: 2,
    usesQuestionCatalog: true,
    passAndPlay: true,
  },
  classic: {
    id: "classic",
    name: "Quiz Classique",
    subtitle: "4 réponses, 15 secondes par question",
    icon: "classic",
    iconBg: "bg-fp-cyan text-fp-text",
    minPlayers: 1,
    usesQuestionCatalog: true,
    passAndPlay: true,
  },
  truefalse: {
    id: "truefalse",
    name: "Vrai ou Faux",
    subtitle: "Rapide et sans pitié",
    icon: "check",
    iconBg: "bg-fp-success",
    minPlayers: 1,
    usesQuestionCatalog: true,
    passAndPlay: true,
  },
  rapidfire: {
    id: "rapidfire",
    name: "Rapid Fire",
    subtitle: "20 questions, 6 secondes chacune",
    icon: "rapidfire",
    iconBg: "bg-fp-yellow text-fp-text",
    minPlayers: 1,
    usesQuestionCatalog: true,
    passAndPlay: true,
  },
  timeline: {
    id: "timeline",
    name: "Timeline",
    subtitle: "Replace les événements dans l'ordre",
    icon: "timeline",
    iconBg: "bg-fp-cyan text-fp-text",
    minPlayers: 1,
    usesQuestionCatalog: false,
    passAndPlay: true,
  },
  teambattle: {
    id: "teambattle",
    name: "Bataille d'équipes",
    subtitle: "Deux équipes s'affrontent",
    icon: "teambattle",
    iconBg: "bg-fp-coral",
    minPlayers: 2,
    usesQuestionCatalog: true,
    passAndPlay: true,
  },
  wyr: {
    id: "wyr",
    name: "Dilemmes",
    subtitle: "Les choix impossibles qui font débat",
    icon: "wyr",
    iconBg: "bg-fp-primary-dark",
    minPlayers: 1,
    usesQuestionCatalog: false,
    passAndPlay: true,
  },
  guess: {
    id: "guess",
    name: "Indices",
    subtitle: "Devine avec des indices progressifs",
    icon: "guess",
    iconBg: "bg-[#64d2ff]",
    minPlayers: 1,
    usesQuestionCatalog: false,
    passAndPlay: true,
  },
  debate: {
    id: "debate",
    name: "Débat",
    subtitle: "Philosophie, politique, éthique — personne ne gagne",
    icon: "debate",
    iconBg: "bg-[#a2845e]",
    minPlayers: 1,
    usesQuestionCatalog: false,
    passAndPlay: true,
  },
  psycho: {
    id: "psycho",
    name: "Profil Psycho",
    subtitle: "18 dilemmes de soirée pour révéler votre véritable archétype",
    icon: "psycho",
    iconBg: "bg-[#8b5cf6]",
    minPlayers: 1,
    usesQuestionCatalog: false,
    passAndPlay: false,
  },
};

export const MODE_SECTIONS: Array<{ title: string; modes: GameMode[] }> = [
  { title: "Quiz & Compétition", modes: ["prism", "classic", "truefalse", "rapidfire", "timeline", "teambattle"] },
  { title: "Psychologie & Discussion", modes: ["psycho", "debate", "wyr", "guess"] },
];

export const CATEGORY_LABELS: Record<QuestionCategory | "mixed", string> = {
  mixed: "Toutes catégories",
  "culture-generale": "Culture générale",
  geographie: "Géographie",
  histoire: "Histoire",
  cinema: "Cinéma",
  series: "Séries",
  musique: "Musique",
  "manga-anime": "Manga & Anime",
  gaming: "Jeux vidéo",
  science: "Science",
  technologie: "Technologie",
  internet: "Internet",
  "mythologie-grecque": "Mythologie grecque",
  "mythologie-egyptienne": "Mythologie égyptienne",
  philosophie: "Philosophie",
  sport: "Sport",
  football: "Football",
  food: "Cuisine",
  voyage: "Voyage",
  art: "Art",
  litterature: "Littérature",
  insolite: "Insolite",
  politique: "Politique",
};

export const QUESTION_COUNT_OPTIONS = [5, 10, 20] as const;
