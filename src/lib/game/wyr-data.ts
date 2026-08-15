/**
 * Free Party — Would You Rather data (spec §55)
 * Dilemmes sociaux drôles et profonds, sans bonne réponse.
 */

export interface WouldYouRatherPair {
  id: string;
  optionA: string;
  optionB: string;
  /** Catégorie du dilemme */
  category: "fun" | "deep" | "daily" | "weird";
}

export const WYR_PAIRS: WouldYouRatherPair[] = [
  { id: "w1", optionA: "Ne plus jamais utiliser Internet", optionB: "Ne plus jamais voir vos amis en vrai", category: "fun" },
  { id: "w2", optionA: "Avoir toujours raison mais personne ne vous écoute", optionB: "Être toujours écouté mais vous tromper souvent", category: "deep" },
  { id: "w3", optionA: "Connaître la date de votre mort", optionB: "Ne jamais savoir comment vous mourrez", category: "deep" },
  { id: "w4", optionA: "Pouvoir lire dans les pensées", optionB: "Pouvoir voir 10 minutes dans le futur", category: "weird" },
  { id: "w5", optionA: "Un an de vacances sans argent", optionB: "Un an d'argent sans vacances", category: "daily" },
  { id: "w6", optionA: "Être riche mais détesté", optionB: "Être pauvre mais aimé", category: "deep" },
  { id: "w7", optionA: "Ne plus jamais manger sucré", optionB: "Ne plus jamais manger salé", category: "fun" },
  { id: "w8", optionA: "Vivre dans le passé sans technologie", optionB: "Vivre dans le futur sans souvenirs", category: "deep" },
  { id: "w9", optionA: "Toujours avoir froid", optionB: "Toujours avoir chaud", category: "fun" },
  { id: "w10", optionA: "Savoir tout ce que les gens pensent de vous", optionB: "Que personne ne sache jamais ce que vous pensez", category: "weird" },
  { id: "w11", optionA: "Un travail passionnant mais mal payé", optionB: "Un travail ennuyeux mais très bien payé", category: "daily" },
  { id: "w12", optionA: "Pouvoir parler toutes les langues", optionB: "Pouvoir jouer de tous les instruments", category: "fun" },
  { id: "w13", optionA: "Refaire votre vie à l'identique", optionB: "Recommencer autrement sans savoir où ça mène", category: "deep" },
  { id: "w14", optionA: "Être célèbre pour un scandale", optionB: "Être anonyme pour un exploit", category: "weird" },
  { id: "w15", optionA: "Vivre 100 ans en bonne santé mais seul", optionB: "Vivre 60 ans entouré des gens que vous aimez", category: "deep" },
  { id: "w16", optionA: "Pouvoir voler", optionB: "Pouvoir être invisible", category: "fun" },
  { id: "w17", optionA: "Toujours dire ce que vous pensez", optionB: "Ne jamais entendre une critique", category: "weird" },
  { id: "w18", optionA: "Gagner 10 000 € par mois", optionB: "Gagner 1 € de plus que la personne que vous détestez", category: "fun" },
  { id: "w19", optionA: "Un week-end parfait chaque semaine", optionB: "Un mois parfait une fois par an", category: "daily" },
  { id: "w20", optionA: "Connaître le sens de la vie", optionB: "Ne jamais douter de vous", category: "deep" },
  { id: "w21", optionA: "Être toujours en retard de 5 minutes", optionB: "Toujours arriver 5 minutes trop tôt", category: "daily" },
  { id: "w22", optionA: "Pouvoir changer d'apparence à volonté", optionB: "Pouvoir changer d'âge à volonté", category: "fun" },
  { id: "w23", optionA: "Un génie qui vous obéit", optionB: "Un ami qui vous comprend", category: "deep" },
  { id: "w24", optionA: "Ne plus jamais avoir peur", optionB: "Ne plus jamais être triste", category: "deep" },
  { id: "w25", optionA: "Manger votre plat préféré tous les jours", optionB: "Découvrir un nouveau plat parfait chaque semaine", category: "fun" },
  { id: "w26", optionA: "Vivre dans une simulation confortable", optionB: "Vivre dans la réalité inconfortable", category: "weird" },
  { id: "w27", optionA: "Être le meilleur dans un domaine", optionB: "Être bon dans tous les domaines", category: "daily" },
  { id: "w28", optionA: "Pouvoir effacer un souvenir", optionB: "Pouvoir revivre un souvenir à volonté", category: "deep" },
  { id: "w29", optionA: "Un téléphone qui ne se décharge jamais", optionB: "Un frigo toujours rempli", category: "fun" },
  { id: "w30", optionA: "Parler aux animaux", optionB: "Comprendre toutes les langues humaines", category: "fun" },
  { id: "w31", optionA: "Être immortel mais vieillir", optionB: "Mourir jeune après une vie parfaite", category: "deep" },
  { id: "w32", optionA: "Toujours gagner aux jeux d'argent", optionB: "Ne jamais perdre aux jeux de société", category: "fun" },
];

export const WYR_CATEGORY_LABELS: Record<string, string> = {
  fun: "Fun",
  deep: "Profond",
  daily: "Quotidien",
  weird: "Bizarre",
};

export function pickWyrPair(excludeIds: string[]): WouldYouRatherPair {
  const available = WYR_PAIRS.filter((p) => !excludeIds.includes(p.id));
  const pool = available.length > 0 ? available : WYR_PAIRS;
  return pool[Math.floor(Math.random() * pool.length)];
}
