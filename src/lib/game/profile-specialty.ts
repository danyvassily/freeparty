/**
 * PRISM / Free Party — Specialties & Profile System (spec §8, §11, §12)
 *
 * Chaque joueur choisit une spécialité unique :
 * - Affichée publiquement sur son profil (ex: "Dany — Spécialité CINÉMA").
 * - Mécanique clé : les questions reçues dans sa spécialité sont automatiquement
 *   de niveau supérieur (Niveau 4 — Expert) pour démontrer sa réelle expertise.
 */
import type { QuestionCategory } from "@/lib/questions/schema";

export interface SpecialtyDefinition {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  description: string;
  descriptionEn: string;
  matchedCategories: QuestionCategory[];
  subtopics: string[];
}

export const SPECIALTIES: SpecialtyDefinition[] = [
  {
    id: "cinema",
    name: "Cinéma & Séries",
    nameEn: "Cinema & TV Shows",
    emoji: "🎬",
    description: "Réalisateurs, plans cultes, chefs-d'œuvre mondiaux et cinéma d'auteur.",
    descriptionEn: "Directors, iconic shots, world masterpieces and auteur cinema.",
    matchedCategories: ["cinema", "series"],
    subtopics: ["Nouvelle Vague", "Cinéma d'auteur", "Science-fiction", "Oscars & Palmes", "Acteurs"],
  },
  {
    id: "art",
    name: "Art & Peinture",
    nameEn: "Art & Painting",
    emoji: "🎨",
    description: "Grands maîtres, mouvements artistiques, musées mondiaux et toiles emblématiques.",
    descriptionEn: "Old masters, art movements, world museums and iconic canvases.",
    matchedCategories: ["art"],
    subtopics: ["Impressionnisme", "Surréalisme", "Renaissance", "Art Moderne", "Musées du monde"],
  },
  {
    id: "philosophie",
    name: "Philosophie",
    nameEn: "Philosophy",
    emoji: "🏛️",
    description: "Concepts fondamentaux, grands penseurs, éthique, métaphysique et épistémologie.",
    descriptionEn: "Core concepts, great thinkers, ethics, metaphysics and epistemology.",
    matchedCategories: ["philosophie"],
    subtopics: ["Antiquité", "Lumières", "Existentialisme", "Éthique", "Philosophie politique"],
  },
  {
    id: "litterature",
    name: "Littérature",
    nameEn: "Literature",
    emoji: "📚",
    description: "Romans majeurs, poésie, prix Nobel et classiques des lettres universelles.",
    descriptionEn: "Major novels, poetry, Nobel prizes and universal literary classics.",
    matchedCategories: ["litterature"],
    subtopics: ["XIXe siècle", "Poésie", "Théâtre", "Prix Nobel", "Grands récits"],
  },
  {
    id: "sciences-humaines",
    name: "Sciences Humaines",
    nameEn: "Humanities & Social Sciences",
    emoji: "🧠",
    description: "Sociologie, psychologie, anthropologie, économie politique et sciences cognitives.",
    descriptionEn: "Sociology, psychology, anthropology, political economy and cognitive sciences.",
    matchedCategories: ["philosophie", "politique", "culture-generale"],
    subtopics: ["Sociologie", "Psychologie", "Économie", "Anthropologie", "Sciences politiques"],
  },
  {
    id: "science",
    name: "Sciences & Technologies",
    nameEn: "Science & Technology",
    emoji: "🔬",
    description: "Physique théorique, astrophysique, biologie, mathématiques et révolutions tech.",
    descriptionEn: "Theoretical physics, astrophysics, biology, mathematics and tech revolutions.",
    matchedCategories: ["science", "technologie"],
    subtopics: ["Astrophysique", "Physique quantique", "Génétique", "Informatique", "Mathématiques"],
  },
  {
    id: "geographie",
    name: "Géographie & Capitales",
    nameEn: "Geography & Capitals",
    emoji: "🌍",
    description: "Capitales du monde, monnaies, frontières, reliefs et géopolitique spatiale.",
    descriptionEn: "World capitals, currencies, borders, landforms and spatial geopolitics.",
    matchedCategories: ["geographie", "voyage"],
    subtopics: ["Capitales", "Monnaies", "Fleuves & Montagnes", "Détroits & Frontières", "Drapeaux"],
  },
  {
    id: "histoire",
    name: "Histoire & Guerres",
    nameEn: "History & Conflicts",
    emoji: "⚔️",
    description: "Grands conflits, traités, civilisations disparues et tournants historiques.",
    descriptionEn: "Major conflicts, treaties, lost civilizations and historical turning points.",
    matchedCategories: ["histoire"],
    subtopics: ["Antiquité", "Guerres mondiales", "Révolutions", "Traités & Alliances", "Empires"],
  },
  {
    id: "sport",
    name: "Sport & Légendes",
    nameEn: "Sports & Legends",
    emoji: "⚽",
    description: "Jeux Olympiques, records d'anthologie, tactique et figures légendaires.",
    descriptionEn: "Olympic Games, all-time records, tactics and legendary figures.",
    matchedCategories: ["sport", "football"],
    subtopics: ["Football", "Tennis", "Jeux Olympiques", "Formule 1", "Athlétisme"],
  },
  {
    id: "musique",
    name: "Musique & Opéra",
    nameEn: "Music & Opera",
    emoji: "🎵",
    description: "Musique classique, opéra, jazz, révolutions rock et pop culture sonore.",
    descriptionEn: "Classical music, opera, jazz, rock revolutions and acoustic culture.",
    matchedCategories: ["musique"],
    subtopics: ["Classique & Baroque", "Opéra", "Jazz", "Rock XXe", "Théorie musicale"],
  },
];

export function getSpecialtyById(id: string): SpecialtyDefinition {
  return SPECIALTIES.find((s) => s.id === id) ?? SPECIALTIES[0];
}

/**
 * Vérifie si une question donnée correspond à la spécialité du joueur.
 */
export function isQuestionInSpecialty(category: QuestionCategory, specialtyId: string): boolean {
  const specialty = getSpecialtyById(specialtyId);
  return specialty.matchedCategories.includes(category);
}

/**
 * Profil joueur enrichi pour PRISM / Free Party (spec §11)
 */
export interface UserProfile {
  id: string;
  username: string;
  locale: "fr" | "en" | "es" | "de" | "it" | "pt";
  specialtyId: string;
  leagueId: string;
  seasonPoints: number;
  xp: number;
  wins: number;
  finalsReached: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  avatarUrl?: string;
  createdAt: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: "local-user",
  username: "Dany",
  locale: "fr",
  specialtyId: "cinema",
  leagueId: "or",
  seasonPoints: 4720,
  xp: 12400,
  wins: 34,
  finalsReached: 52,
  losses: 18,
  currentStreak: 4,
  bestStreak: 9,
  createdAt: new Date().toISOString(),
};
