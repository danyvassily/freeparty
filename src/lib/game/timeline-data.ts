/**
 * Free Party — Timeline events (spec §48)
 * Événements historiques à replacer dans l'ordre chronologique.
 * Faits stables, dates largement consensuelles.
 */

export interface TimelineEvent {
  id: string;
  label: string;
  year: number;
  /** Note affichée après validation */
  note?: string;
}

export const TIMELINE_SETS: TimelineEvent[][] = [
  [
    { id: "t1a", label: "Chute de l'Empire romain d'Occident", year: 476, note: "Déposition de Romulus Augustule." },
    { id: "t1b", label: "Prise de Constantinople par les Ottomans", year: 1453, note: "Fin de l'Empire byzantin." },
    { id: "t1c", label: "Découverte de l'Amérique par Christophe Colomb", year: 1492, note: "Premier voyage transatlantique." },
    { id: "t1d", label: "Révolution française", year: 1789, note: "Prise de la Bastille le 14 juillet." },
    { id: "t1e", label: "Chute du mur de Berlin", year: 1989, note: "Symbole de la fin de la guerre froide." },
  ],
  [
    { id: "t2a", label: "Bataille de Marathon", year: -490, note: "Victoire athénienne sur les Perses." },
    { id: "t2b", label: "Bataille de Salamine", year: -480, note: "Victoire navale grecque." },
    { id: "t2c", label: "Guerre du Péloponnèse (fin)", year: -404, note: "Défaite d'Athènes face à Sparte." },
    { id: "t2d", label: "Mort d'Alexandre le Grand", year: -323, note: "Fin des conquêtes macédoniennes." },
    { id: "t2e", label: "Bataille de Zama", year: -202, note: "Victoire de Scipion sur Hannibal." },
  ],
  [
    { id: "t3a", label: "Couronnement de Charlemagne", year: 800, note: "Empereur d'Occident." },
    { id: "t3b", label: "Première croisade (prise de Jérusalem)", year: 1099, note: "Croisade prêchée par Urbain II." },
    { id: "t3c", label: "Bataille de Bouvines", year: 1214, note: "Victoire de Philippe Auguste." },
    { id: "t3d", label: "Début de la guerre de Cent Ans", year: 1337, note: "Conflit franco-anglais." },
    { id: "t3e", label: "Bataille d'Azincourt", year: 1415, note: "Victoire anglaise d'Henri V." },
    { id: "t3f", label: "Jeanne d'Arc à Orléans", year: 1429, note: "Levée du siège d'Orléans." },
  ],
  [
    { id: "t4a", label: "Copernic publie De revolutionibus", year: 1543, note: "Système héliocentrique." },
    { id: "t4b", label: "Naufrage de l'Invincible Armada", year: 1588, note: "Défaite espagnole face à l'Angleterre." },
    { id: "t4c", label: "Édit de Nantes", year: 1598, note: "Tolérance religieuse en France." },
    { id: "t4d", label: "Traité de Westphalie", year: 1648, note: "Fin de la guerre de Trente Ans." },
    { id: "t4e", label: "Newton publie les Principia", year: 1687, note: "Gravitation universelle." },
  ],
  [
    { id: "t5a", label: "Révolution industrielle : machine à vapeur de Watt", year: 1769, note: "Brevets et perfectionnements successifs." },
    { id: "t5b", label: "Déclaration d'indépendance des États-Unis", year: 1776, note: "4 juillet 1776." },
    { id: "t5c", label: "Bataille de Waterloo", year: 1815, note: "Fin de l'épopée napoléonienne." },
    { id: "t5d", label: "Abolition de l'esclavage en France", year: 1848, note: "Décret du 27 avril 1848." },
    { id: "t5e", label: "Exposition universelle de Paris (tour Eiffel)", year: 1889, note: "Inauguration de la tour Eiffel." },
  ],
  [
    { id: "t6a", label: "Attentat de Sarajevo", year: 1914, note: "Déclencheur de la Première Guerre mondiale." },
    { id: "t6b", label: "Traité de Versailles", year: 1919, note: "Fin officielle de la Grande Guerre." },
    { id: "t6c", label: "Crise de 1929 (krach de Wall Street)", year: 1929, note: "Jeudi noir du 24 octobre." },
    { id: "t6d", label: "Débarquement de Normandie", year: 1944, note: "Jour J, 6 juin 1944." },
    { id: "t6e", label: "Création de l'ONU", year: 1945, note: "Charte signée à San Francisco." },
  ],
  [
    { id: "t7a", label: "Premier homme dans l'espace (Gagarine)", year: 1961, note: "12 avril 1961, Vostok 1." },
    { id: "t7b", label: "Premier pas sur la Lune (Apollo 11)", year: 1969, note: "21 juillet 1969, Armstrong." },
    { id: "t7c", label: "Chute du mur de Berlin", year: 1989, note: "9 novembre 1989." },
    { id: "t7d", label: "Dissolution de l'URSS", year: 1991, note: "Décembre 1991." },
    { id: "t7e", label: "Création de l'euro (monnaie unique)", year: 1999, note: "Lancement en monnaie scripturale." },
    { id: "t7f", label: "Premier iPhone", year: 2007, note: "Annoncé par Steve Jobs en janvier." },
  ],
];

/** Sélectionne un lot aléatoire sans répéter le dernier */
export function pickTimelineSet(lastSetId: string | null): { setId: string; events: TimelineEvent[] } {
  const available = TIMELINE_SETS.map((set, i) => ({ setId: `set-${i}`, events: set })).filter(
    (s) => s.setId !== lastSetId,
  );
  const chosen = available[Math.floor(Math.random() * available.length)];
  // Fisher-Yates : mélange uniforme pour l'affichage
  const shuffled = [...chosen.events];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { setId: chosen.setId, events: shuffled };
}
