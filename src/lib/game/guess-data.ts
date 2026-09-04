/**
 * Free Party — Guess data (spec §55)
 * Concepts à deviner via indices progressifs. Faits stables.
 */

export interface GuessItem {
  id: string;
  answer: string;
  hints: string[]; // du plus vague au plus précis
  category: "lieu" | "personnage" | "objet" | "animal" | "monument";
}

export const GUESS_ITEMS: GuessItem[] = [
  { id: "g1", answer: "Paris", hints: ["C'est une ville", "Elle est en Europe", "Elle est traversée par un grand fleuve", "Sa tour la plus célèbre a été construite en 1889"], category: "lieu" },
  { id: "g2", answer: "Cléopâtre", hints: ["C'est une femme célèbre", "Elle a vécu dans l'Antiquité", "Elle a régné sur l'Égypte", "Elle a séduit Jules César puis Marc Antoine"], category: "personnage" },
  { id: "g3", answer: "La Tour Eiffel", hints: ["C'est un monument", "Il est en France", "Il est en fer", "Il mesure environ 330 mètres et a été construit pour l'Exposition universelle"], category: "monument" },
  { id: "g4", answer: "L'éléphant", hints: ["C'est un animal", "C'est le plus grand animal terrestre", "Il a une trompe", "Il vit en Afrique et en Asie"], category: "animal" },
  { id: "g5", answer: "Napoléon", hints: ["C'est un personnage historique", "Il est français", "Il est devenu empereur", "Il a perdu la bataille de Waterloo en 1815"], category: "personnage" },
  { id: "g6", answer: "Le Nil", hints: ["C'est un fleuve", "Il est en Afrique", "Il traverse l'Égypte", "C'est le plus long fleuve du monde (avec l'Amazone, selon les mesures)"], category: "lieu" },
  { id: "g7", answer: "L'imprimante", hints: ["C'est un objet", "Il se trouve souvent dans un bureau", "Il utilise de l'encre", "Il permet de mettre du texte sur papier"], category: "objet" },
  { id: "g8", answer: "Le Taj Mahal", hints: ["C'est un monument", "Il est en Asie", "Il est en marbre blanc", "Il a été construit en Inde par un empereur moghol pour sa femme"], category: "monument" },
  { id: "g9", answer: "Jules Verne", hints: ["C'est un écrivain", "Il est français", "Il a écrit des romans d'aventures", "Il a imaginé Vingt mille lieues sous les mers"], category: "personnage" },
  { id: "g10", answer: "Le cacao", hints: ["C'est un ingrédient", "Il vient d'une fève", "Il pousse sous les tropiques", "Il sert à fabriquer le chocolat"], category: "objet" },
  { id: "g11", answer: "La Grande Muraille de Chine", hints: ["C'est un monument", "Il est en Asie", "Il s'étend sur des milliers de kilomètres", "Il a été construit pour protéger la Chine des invasions"], category: "monument" },
  { id: "g12", answer: "Le manchot", hints: ["C'est un animal", "Il vit dans l'hémisphère sud", "Il ne vole pas", "Il marche en se dandinant et plonge très bien"], category: "animal" },
  { id: "g13", answer: "Marie Curie", hints: ["C'est une scientifique", "Elle a travaillé sur la radioactivité", "Elle a reçu deux prix Nobel", "Elle a découvert le polonium et le radium"], category: "personnage" },
  { id: "g14", answer: "Le vélo", hints: ["C'est un objet", "Il a deux roues", "Il fonctionne à la force humaine", "Il a été inventé au XIXe siècle et a une chaîne"], category: "objet" },
  { id: "g15", answer: "Le désert du Sahara", hints: ["C'est un lieu", "Il est en Afrique", "C'est un désert de sable", "C'est le plus grand désert chaud du monde"], category: "lieu" },
  { id: "g16", answer: "William Shakespeare", hints: ["C'est un écrivain", "Il est anglais", "Il a vécu à la Renaissance", "Il a écrit Roméo et Juliette et Hamlet"], category: "personnage" },
  { id: "g17", answer: "Le téléphone", hints: ["C'est un objet", "Il permet de communiquer", "Alexander Graham Bell l'a popularisé", "Aujourd'hui il est dans presque toutes les poches"], category: "objet" },
  { id: "g18", answer: "La Statue de la Liberté", hints: ["C'est un monument", "Il est aux États-Unis", "Il a été offert par la France", "Il se trouve à New York, sur une île"], category: "monument" },
  { id: "g19", answer: "L'abeille", hints: ["C'est un animal", "Il est petit et ailé", "Il produit du miel", "Il butine les fleurs et pollinise les plantes"], category: "animal" },
  { id: "g20", answer: "Albert Einstein", hints: ["C'est un scientifique", "Il est né en Allemagne", "Il a développé la théorie de la relativité", "Sa célèbre équation est E=mc²"], category: "personnage" },
];

export function pickGuessItem(excludeIds: string[]): GuessItem {
  const available = GUESS_ITEMS.filter((g) => !excludeIds.includes(g.id));
  const pool = available.length > 0 ? available : GUESS_ITEMS;
  return pool[Math.floor(Math.random() * pool.length)];
}
