import { getRoastGifs, type RoastGif, type RoastGifContext } from "@/lib/game/roast-gifs";

export interface RoundRoastPlayer {
  id: string;
  name: string;
  score: number;
  correct?: number;
  total?: number;
}

export interface PlayerRoast {
  playerId: string;
  title: string;
  comment: string;
  context: RoastGifContext;
  gif: RoastGif;
  rank: number;
}

const COMMENTS: Record<RoastGifContext, readonly string[]> = {
  champion: [
    "T'as joué comme si le Wi-Fi de la victoire était branché directement sur ton cerveau. Calme-toi, laisse-en un peu aux autres.",
    "Victoire propre, ego probablement moins propre dans environ trente secondes. Profite, champion.",
    "Tu viens de transformer la manche en démonstration gratuite. Les autres ont pris des notes… enfin, on espère.",
  ],
  on_fire: [
    "T'étais tellement en feu qu'on a failli appeler les pompiers. Encore une réponse juste et la table fondait.",
    "Grosse précision aujourd'hui. On dirait que ton cerveau avait enfin installé la dernière mise à jour.",
    "Très solide. Même tes réponses au hasard avaient l'air de connaître le programme.",
  ],
  close_call: [
    "À deux doigts du sommet. Littéralement deux doigts… ceux qui ont appuyé sur les mauvaises réponses.",
    "Tu as collé le gagnant jusqu'au bout. Encore un petit effort et tu lui faisais vraiment peur.",
    "Belle manche, mais la médaille d'or t'a laissé en vu. Ça arrive même aux meilleurs presque-meilleurs.",
  ],
  tie: [
    "Égalité parfaite. Vous avez tellement refusé de vous départager que même le classement a abandonné.",
    "Même score, même ego, et maintenant personne ne peut frimer correctement. Quel gâchis magnifique.",
    "Vous finissez à égalité : la revanche n'est plus une option, c'est une obligation administrative.",
  ],
  middle: [
    "Ni catastrophe, ni légende : tu as choisi la confortable carrière de figurant premium.",
    "Une manche bien au milieu, comme le fromage dans un croque-monsieur : utile, mais personne ne crie ton nom.",
    "Tu as sécurisé le ventre mou du classement avec une maîtrise franchement impressionnante.",
  ],
  confused: [
    "Il y avait de bonnes idées… elles se sont juste perdues en chemin entre ton cerveau et le bouton.",
    "Ton instinct a beaucoup parlé. Le problème, c'est qu'il racontait surtout n'importe quoi.",
    "Tu as répondu avec confiance, et c'est déjà magnifique. Pour la précision, on verra à la prochaine manche.",
  ],
  last_place: [
    "Tu n'as pas perdu : tu as généreusement offert un tutoriel de victoire à tout le groupe.",
    "Dernier, oui, mais avec une régularité de métronome. Même le hasard aurait demandé une pause café.",
    "Le classement t'a cherché en haut, puis il a compris qu'il fallait descendre tout en bas. Quelle entrée dramatique.",
    "Tu as porté la lanterne rouge avec panache. Bon, surtout la lanterne rouge, mais avec panache quand même.",
  ],
  zero_score: [
    "Zéro point, mais cent pour cent d'ambiance. Le bouton au hasard te remercie pour sa confiance aveugle.",
    "Score vierge, conscience tranquille. Aucune bonne réponse n'est venue perturber ta soirée.",
    "Tu viens de réussir le grand chelem inversé. C'est rare, c'est audacieux, et surtout c'est très pratique pour les autres.",
  ],
  solo: [
    "Personne à battre, alors tu as décidé de te battre contre toi-même. Le duel était étonnamment serré.",
    "Une partie solo, un public conquis : toi. Honnêtement, l'ambiance était irréprochable.",
    "Tu étais à la fois le favori et l'outsider. Les bookmakers sont encore en train de recalculer.",
  ],
};

const TITLES: Record<RoastGifContext, string> = {
  champion: "Le boss de la manche",
  on_fire: "Cerveau en surchauffe",
  close_call: "Presque roi, presque",
  tie: "Match nul, ego intact",
  middle: "Figurant cinq étoiles",
  confused: "Instinct en roue libre",
  last_place: "Lanterne rouge deluxe",
  zero_score: "Grand chelem inversé",
  solo: "Seul contre le monde",
};

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function pick<T>(values: readonly T[], seed: string): T {
  return values[hash(seed) % values.length];
}

function contextFor(player: RoundRoastPlayer, rank: number, ranking: RoundRoastPlayer[]): RoastGifContext {
  if (ranking.length === 1) return "solo";
  if (ranking.every((candidate) => candidate.score === ranking[0].score)) return "tie";
  if (player.score === 0) return "zero_score";
  if (rank === 0) return "champion";
  if (rank === ranking.length - 1) return "last_place";

  const accuracy = player.total && player.correct !== undefined ? player.correct / player.total : null;
  if (accuracy !== null && accuracy >= 0.75) return "on_fire";
  if (rank === 1 && ranking[0].score - player.score <= Math.max(10, ranking[0].score * 0.15)) return "close_call";
  if (accuracy !== null && accuracy < 0.35) return "confused";
  return "middle";
}

export function buildRoundRoasts(players: readonly RoundRoastPlayer[], seed = "round"): PlayerRoast[] {
  const ranking = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "fr"));

  return ranking.map((player, rank) => {
    const context = contextFor(player, rank, ranking);
    const playerSeed = `${seed}:${player.id}:${player.score}:${rank}:${context}`;
    return {
      playerId: player.id,
      rank,
      context,
      title: TITLES[context],
      comment: pick(COMMENTS[context], playerSeed),
      gif: pick(getRoastGifs(context), `${playerSeed}:gif`),
    };
  });
}
