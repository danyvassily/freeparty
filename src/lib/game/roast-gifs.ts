export type RoastGifContext =
  | "champion"
  | "on_fire"
  | "close_call"
  | "tie"
  | "middle"
  | "confused"
  | "last_place"
  | "zero_score"
  | "solo";

export interface RoastGif {
  id: string;
  context: RoastGifContext;
  imageUrl: string;
  sourceUrl: string;
  alt: string;
  attribution: string;
}

function giphy(
  id: string,
  context: RoastGifContext,
  sourceUrl: string,
  alt: string,
  attribution: string,
): RoastGif {
  return {
    id,
    context,
    // La variante 200w réduit fortement le poids par rapport au GIF original,
    // surtout lorsqu'un bilan affiche plusieurs joueurs sur mobile.
    imageUrl: `https://media.giphy.com/media/${id}/200w.gif`,
    sourceUrl,
    alt,
    attribution: `${attribution} · GIPHY`,
  };
}

/**
 * Catalogue éditorial de GIFs publics. Chaque entrée conserve sa page source
 * afin de pouvoir remplacer un média indisponible sans toucher au moteur.
 */
export const ROAST_GIFS: readonly RoastGif[] = [
  giphy("ZAhIPOcK0wgmuwCums", "champion", "https://giphy.com/gifs/pokemon-pokemon-unite-championships-ucs-ZAhIPOcK0wgmuwCums", "Célébration de victoire Pokémon", "Pokémon"),
  giphy("V7HUS7VvI7oBzP4K8C", "champion", "https://giphy.com/gifs/xbox-game-xbox-series-x-s-V7HUS7VvI7oBzP4K8C", "Célébration après une victoire", "Xbox"),
  giphy("3nqVglxK0xtCbdai1P", "champion", "https://giphy.com/gifs/jargonjoe-3nqVglxK0xtCbdai1P", "Michael Scott célèbre sa victoire", "Jargon Joe · The Office"),
  giphy("3o7WTu8zqJ0UCXd8KQ", "champion", "https://giphy.com/gifs/nickatnite-friends-joey-tribbiani-3o7WTu8zqJ0UCXd8KQ", "Joey danse pour célébrer", "Nick at Nite · Friends"),
  giphy("26u4exk4zsAqPcq08", "champion", "https://giphy.com/gifs/awkwafina-26u4exk4zsAqPcq08", "Awkwafina célèbre avec un trophée", "Awkwafina"),
  giphy("xkhYa5Vf7LG25sFAG8", "champion", "https://giphy.com/gifs/minions-xkhYa5Vf7LG25sFAG8", "Les Minions acclament le gagnant", "Minions"),
  giphy("r95kAgBEzeapljl1ft", "champion", "https://giphy.com/gifs/disneyprincess-r95kAgBEzeapljl1ft", "Blanche-Neige danse pour fêter la victoire", "Disney Princess"),
  giphy("53hmPSFgwHPNs3I8wN", "champion", "https://giphy.com/gifs/disneyplus-disney-plus-wreck-it-ralph-53hmPSFgwHPNs3I8wN", "Célébration d'une médaille d'or", "Disney+ · Wreck-It Ralph"),
  giphy("vip8tVDnIw66HgXEc1", "on_fire", "https://giphy.com/gifs/Frito-Lay-cheetos-reaper-reactions-vip8tVDnIw66HgXEc1", "Joueur complètement en feu", "Frito-Lay"),
  giphy("3ohs7XgSonJYtvAzUQ", "on_fire", "https://giphy.com/gifs/nba-celebration-mia-3ohs7XgSonJYtvAzUQ", "Célébration enflammée", "NBA"),
  giphy("y4MKnaBOk1fH3enmcW", "on_fire", "https://giphy.com/gifs/manutd-happy-winner-get-in-y4MKnaBOk1fH3enmcW", "Célébration de joueur en feu", "Manchester United"),
  giphy("SPiRcNhJXq5NZkAPia", "on_fire", "https://giphy.com/gifs/digi995-win-streak-on-a-going-SPiRcNhJXq5NZkAPia", "Robot lancé dans une série de victoires", "Digi 995"),
  giphy("l0Iyb1KcVIu4NpmXm", "close_call", "https://giphy.com/gifs/mattcutshall-matt-cutshall-l0Iyb1KcVIu4NpmXm", "Soulagement après un résultat très serré", "Matt Cutshall"),
  giphy("FH5oGQPfGIRZG5uzg6", "close_call", "https://giphy.com/gifs/HollerStudios-animation-reaction-gif-holler-studios-FH5oGQPfGIRZG5uzg6", "Petit personnage nerveux après un score serré", "Holler Studios"),
  giphy("KcnIdXKOuvxNjLqYc1", "close_call", "https://giphy.com/gifs/reaction-panic-KcnIdXKOuvxNjLqYc1", "Sourire nerveux et grosse sueur", "Billy Budgen"),
  giphy("dyEzCJuU1dk6HOnTWR", "tie", "https://giphy.com/gifs/Ludo-Studio-chores-the-strange-dyEzCJuU1dk6HOnTWR", "Égalité accueillie avec un haussement d'épaules", "Ludo Studio"),
  giphy("Gb8kaYpF2VgGZMqxxz", "tie", "https://giphy.com/gifs/disneychannelofficial-zombies-disney-channel-dcom-Gb8kaYpF2VgGZMqxxz", "Applaudissements pour les joueurs à égalité", "Disney Channel"),
  giphy("dyEzCJuU1dk6HOnTWR", "middle", "https://giphy.com/gifs/Ludo-Studio-chores-the-strange-dyEzCJuU1dk6HOnTWR", "Haussement d'épaules détendu", "Ludo Studio"),
  giphy("xT1XGyUR9PSfwfUeAw", "middle", "https://giphy.com/gifs/originals-reaction-xT1XGyUR9PSfwfUeAw", "Facepalm devant un résultat très moyen", "GIPHY Studios"),
  giphy("26ueZWsfa2Xdvd3q0", "middle", "https://giphy.com/gifs/disneyanimation-reaction-disney-animation-26ueZWsfa2Xdvd3q0", "Ralph reçoit son résultat avec philosophie", "Walt Disney Animation Studios"),
  giphy("NoKdKuxIE1BALRfcz2", "confused", "https://giphy.com/gifs/sesamestreet-reaction-confused-ssilly-NoKdKuxIE1BALRfcz2", "Réaction perplexe et amusée", "Sesame Street"),
  giphy("RGj3cbsZNvZ2vQE3ZO", "confused", "https://giphy.com/gifs/sheep-timmy-timmytime-RGj3cbsZNvZ2vQE3ZO", "Petit mouton qui réfléchit très fort", "Aardman Animations"),
  giphy("Qxc0MisEYnDN8wmk2A", "confused", "https://giphy.com/gifs/disneyplus-Qxc0MisEYnDN8wmk2A", "Agatha fixe le résultat avec confusion", "Disney+ · Marvel"),
  giphy("vOkC6iBfa6allFkKrp", "confused", "https://giphy.com/gifs/marvelstudios-marvel-loki-studios-vOkC6iBfa6allFkKrp", "Loki essaie de comprendre ce qui vient d'arriver", "Marvel Studios"),
  giphy("adftUNoOPKeq8MiF5i", "confused", "https://giphy.com/gifs/marvelstudios-agatha-harkness-all-along-adftUNoOPKeq8MiF5i", "Agatha réagit avec une grande surprise", "Marvel Studios"),
  giphy("3o7TKqm7IhwmJ87ZVm", "last_place", "https://giphy.com/gifs/atomicpuppet-fail-3o7TKqm7IhwmJ87ZVm", "Échec cartoonesque sans gravité", "Atomic Puppet"),
  giphy("l41Ym49ppcDP6iY3C", "last_place", "https://giphy.com/gifs/spongebob-l41Ym49ppcDP6iY3C", "Patrick insiste malgré un échec évident", "SpongeBob SquarePants"),
  giphy("d2W7eZX5z62ziqdi", "last_place", "https://giphy.com/gifs/starwars-d2W7eZX5z62ziqdi", "Yoda assiste à un échec mémorable", "Star Wars"),
  giphy("SXOfBHLO4q0X4BlUdW", "last_place", "https://giphy.com/gifs/whitneycummings-smh-whitney-cummings-can-i-touch-it-SXOfBHLO4q0X4BlUdW", "Facepalm devant la dernière place", "Whitney Cummings"),
  giphy("TdwC0ttWBdqTVuENYb", "zero_score", "https://giphy.com/gifs/jeopardy-fine-this-is-its-TdwC0ttWBdqTVuENYb", "Tout va parfaitement bien malgré le chaos", "Jeopardy!"),
  giphy("3oriO09iMYkt6bAPpm", "zero_score", "https://giphy.com/gifs/atomicpuppet-cartoon-shocked-3oriO09iMYkt6bAPpm", "Personnage assommé par un score incroyable", "Atomic Puppet"),
  giphy("ZZrUb2OiU5WDuqmShc", "zero_score", "https://giphy.com/gifs/CartoonNetworkAsia-super-shiro-ZZrUb2OiU5WDuqmShc", "Choc total devant le tableau des scores", "Cartoon Network Asia"),
  giphy("NxTJSoyuHvDSACS0xI", "solo", "https://giphy.com/gifs/netflix-thinking-i-dont-know-hm-NxTJSoyuHvDSACS0xI", "Réflexion intense après la partie", "Netflix"),
  giphy("W6Lwg2xvTr6tJpuSTd", "solo", "https://giphy.com/gifs/minions-minions-2-rise-of-gru-W6Lwg2xvTr6tJpuSTd", "Les Minions font la fête en solo", "Minions"),
] as const;

export function getRoastGifs(context: RoastGifContext): RoastGif[] {
  const exact = ROAST_GIFS.filter((gif) => gif.context === context);
  return exact.length > 0 ? exact : ROAST_GIFS.filter((gif) => gif.context === "middle");
}
