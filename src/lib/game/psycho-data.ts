/**
 * JOUXTA — Profil Psycho : Données & Archétypes
 * 18 scénarios & dilemmes psychologiques pour révéler le tempérament de soirée.
 */

export type PsychoArchetypeId =
  | "stratege"
  | "chaos"
  | "diplomate"
  | "protecteur"
  | "cameleon"
  | "franc_tireur"
  | "analyste"
  | "roi_soleil";

export interface PsychoArchetype {
  id: PsychoArchetypeId;
  name: string;
  badge: string;
  emoji: string;
  quote: string;
  tagline: string;
  description: string;
  superpower: string;
  blindSpot: string;
  partySurvival: string;
  idealPair: {
    id: PsychoArchetypeId;
    name: string;
    reason: string;
  };
  nemesisPair: {
    id: PsychoArchetypeId;
    name: string;
    reason: string;
  };
  color: string;
  kawaiiTheme: "thinking" | "party" | "speed" | "happy" | "referee" | "debate";
}

export const PSYCHO_ARCHETYPES: Record<PsychoArchetypeId, PsychoArchetype> = {
  stratege: {
    id: "stratege",
    name: "Le Stratège Machiavélique",
    badge: "Cerveau de l'Ombre",
    emoji: "🧠",
    quote: "« Je n'ai pas de problème avec les règles, tant que c'est moi qui les écris. »",
    tagline: "Visionnaire à long terme, calculateur impassible et redoutablement efficace.",
    description:
      "Vous ne jouez pas à la même partie que les autres. Pendant que vos amis réagissent à l'instant présent, vous avez déjà visualisé les 5 prochains coups. Vous maîtrisez l'art de l'influence discrète et vous savez exactement quel levier actionner pour obtenir ce que vous voulez sans jamais hausser le ton.",
    superpower: "Capacité à anticiper les retournements de situation et à manipuler le hasard en votre faveur.",
    blindSpot: "Tendance à sur-analyser les intentions innocentes et difficulté à lâcher prise sans plan B.",
    partySurvival: "S'installe au bout de la table ou près du buffet pour observer les dynamiques sociales sans être exposé.",
    idealPair: {
      id: "protecteur",
      name: "Le Protecteur Absolu",
      reason: "Leur loyauté inconditionnelle sécurise vos plans les plus ambitieux sans risque de trahison.",
    },
    nemesisPair: {
      id: "chaos",
      name: "L'Agent du Chaos",
      reason: "Leur imprévisibilité totale détruit vos projections méthodiques en 3 secondes.",
    },
    color: "#4f46e5",
    kawaiiTheme: "thinking",
  },
  chaos: {
    id: "chaos",
    name: "L'Agent du Chaos",
    badge: "Allumeur de Mèche",
    emoji: "⚡",
    quote: "« Si tout le monde est d'accord, c'est qu'il est temps de tout faire sauter. »",
    tagline: "Spontané, provocateur ludique, allergique à la routine et catalyseur d'énergie.",
    description:
      "L'ennui est votre ennemi juré. Vous adorez poser LA question qui jette un froid pour regarder la pièce s'embraser de rires ou de débats passionnés. Rien n'est sacré à vos yeux, surtout pas les convenances. Vous vivez pour l'imprévu, l'intensité et les anecdotes légendaires.",
    superpower: "Désamorce les situations tendues par le rire et injecte une énergie communicative foudroyante.",
    blindSpot: "Peut blesser sans le vouloir par excès d'ironie ou pousser les limites trop loin.",
    partySurvival: "Change de groupe toutes les 12 minutes et lance un jeu improvisé à 2h du matin.",
    idealPair: {
      id: "cameleon",
      name: "Le Caméléon Social",
      reason: "Ils amplifient vos délires et rattrapent diplomatiquement les pots cassés.",
    },
    nemesisPair: {
      id: "analyste",
      name: "L'Analyste Lucidité",
      reason: "Leur scepticisme froid et leurs faits démontent vos blagues avant même la chute.",
    },
    color: "#f59e0b",
    kawaiiTheme: "speed",
  },
  diplomate: {
    id: "diplomate",
    name: "Le Diplomate Suisse",
    badge: "Pacificateur Suprême",
    emoji: "🕊️",
    quote: "« On peut trouver un terrain d'entente... ou commander deux pizzas différentes. »",
    tagline: "Médiateur né, champion du consensus et gardien de la paix sociale.",
    description:
      "Vous avez un radar intérieur pour détecter le moindre malaise ou tension. Véritable ciment du groupe, vous arrondissez les angles, traduisez les propos mal compris et vous assurez que personne ne reste seul dans son coin. Votre patience force le respect.",
    superpower: "Désescalade n'importe quel conflit familial ou amical en trouvant le compromis parfait.",
    blindSpot: "Peur viscérale du conflit direct, au point d'oublier parfois d'exprimer vos propres désirs.",
    partySurvival: "S'assure que tout le monde a un verre et change subtilement de musique quand le ton monte.",
    idealPair: {
      id: "roi_soleil",
      name: "Le Roi-Soleil Bienveillant",
      reason: "Leur chaleur humaine naturelle facilite votre mission de rassemblement.",
    },
    nemesisPair: {
      id: "franc_tireur",
      name: "Le Franc-Tireur Audacieux",
      reason: "Leur franchise brutale et sans filtre sabote tous vos efforts de diplomatie.",
    },
    color: "#10b981",
    kawaiiTheme: "referee",
  },
  protecteur: {
    id: "protecteur",
    name: "Le Protecteur Absolu",
    badge: "Bouclier Inébranlable",
    emoji: "🛡️",
    quote: "« Touche à un cheveu de mes potes et on va avoir une discussion très désagréable. »",
    tagline: "Dévoué corps et âme à sa garde rapprochée, loyal jusqu'à la férocité.",
    description:
      "Pour vous, l'amitié n'est pas un concept à la mode, c'est un serment de sang. Fiable comme une horloge suisse, vous êtes celui qu'on appelle à 4h du matin en cas de pépin. Vous ne pardonnez ni la trahison, ni le manque de respect envers ceux que vous aimez.",
    superpower: "Sens aigu de la protection et fidélité à toute épreuve face à l'adversité.",
    blindSpot: "Méfiance instinctive envers les nouveaux venus et rancune tenace en cas d'affront.",
    partySurvival: "Surveille les sacs, commande les taxis et gère le retour des amis éméchés sans sourciller.",
    idealPair: {
      id: "stratege",
      name: "Le Stratège Machiavélique",
      reason: "Une alliance solide : le cerveau tactique et le rempart protecteur.",
    },
    nemesisPair: {
      id: "cameleon",
      name: "Le Caméléon Social",
      reason: "Leur manque apparent de loyauté fixe vous inspire une méfiance immédiate.",
    },
    color: "#2563eb",
    kawaiiTheme: "party",
  },
  cameleon: {
    id: "cameleon",
    name: "Le Caméléon Social",
    badge: "Maître des Miroirs",
    emoji: "🎭",
    quote: "« Je m'entends bien avec tout le monde, surtout quand ça m'arrange. »",
    tagline: "Hyper-adaptable, miroir des attentes d'autrui et virtuose des codes relationnels.",
    description:
      "Vous pouvez dîner avec des ministres, puis enchaîner avec un concert underground sans jamais être déplacé. Vous scannez instantanément l'ambiance d'une pièce et adoptez le ton parfait pour séduire, rassurer ou convaincre votre auditoire.",
    superpower: "Facilité déconcertante à nouer des alliances et à naviguer dans tous les cercles sociaux.",
    blindSpot: "Risque de perdre le contact avec ce que vous pensez réellement à force de plaire à tous.",
    partySurvival: "Capable d'animer aussi bien la cuisine que le salon ou la terrasse en un clin d'œil.",
    idealPair: {
      id: "chaos",
      name: "L'Agent du Chaos",
      reason: "Vous canalisez leur folie pour en faire le clou de la soirée.",
    },
    nemesisPair: {
      id: "protecteur",
      name: "Le Protecteur Absolu",
      reason: "Ils jugent votre flexibilité sociale comme de l'hypocrisie déguisée.",
    },
    color: "#8b5cf6",
    kawaiiTheme: "happy",
  },
  franc_tireur: {
    id: "franc_tireur",
    name: "Le Franc-Tireur Audacieux",
    badge: "Électron Libre",
    emoji: "🚀",
    quote: "« Je préfère me planter selon mes règles que réussir selon les vôtres. »",
    tagline: "Fonceur instinctif, pionnier intrépide et réfractaire absolu à l'autorité.",
    description:
      "Les protocoles vous donnent des boutons. Vous prenez des décisions à la vitesse de l'éclair, assumez les risques avec panache et dites tout haut ce que tout le monde chuchote tout bas. Vous êtes incapable de faire semblant.",
    superpower: "Courage décisif pour trancher quand tout le monde hésite et tracer de nouvelles voies.",
    blindSpot: "Impulsivité qui frise parfois la témérité aveugle et rejet viscéral des conseils bienveillants.",
    partySurvival: "Arrive à l'improviste, propose une idée folle et repart dès qu'il s'ennuie.",
    idealPair: {
      id: "analyste",
      name: "L'Analyste Lucidité",
      reason: "Leur lucidité vous évite de foncer droit dans un mur sans brider votre élan.",
    },
    nemesisPair: {
      id: "diplomate",
      name: "Le Diplomate Suisse",
      reason: "Leurs précautions et compromis vous donnent l'impression de perdre votre temps.",
    },
    color: "#ef4444",
    kawaiiTheme: "speed",
  },
  analyste: {
    id: "analyste",
    name: "L'Analyste Lucidité",
    badge: "Scanner Humain",
    emoji: "🔬",
    quote: "« C'est une affirmation intéressante. Tu as des données pour prouver ça ? »",
    tagline: "Observateur silencieux, traqueur d'incohérences et pourfendeur de faux-semblants.",
    description:
      "Vous voyez ce que les autres manquent. Rien ne vous échappe : les micro-expressions, les contradictions logiques ou les exagérations théâtrales. Vous préférez une vérité qui dérange à un mensonge confortable, et vos analyses tombent souvent juste.",
    superpower: "Clairvoyance implacable pour démasquer les impostures et résoudre les énigmes complexes.",
    blindSpot: "Passe parfois pour froid ou cassant en privilégiant les faits bruts sur la sensibilité d'autrui.",
    partySurvival: "Écoute attentivement les débats de comptoir en souriant intérieurement des sophismes.",
    idealPair: {
      id: "franc_tireur",
      name: "Le Franc-Tireur Audacieux",
      reason: "Vous leur fournissez la carte pendant qu'ils foncent dans la mêlée.",
    },
    nemesisPair: {
      id: "roi_soleil",
      name: "Le Roi-Soleil Bienveillant",
      reason: "Leur besoin d'applaudissements vous semble disproportionné et vain.",
    },
    color: "#0284c7",
    kawaiiTheme: "debate",
  },
  roi_soleil: {
    id: "roi_soleil",
    name: "Le Roi-Soleil Bienveillant",
    badge: "Moteur Magnétique",
    emoji: "👑",
    quote: "« Une fête réussie est une fête où tout le monde brille... autour de moi. »",
    tagline: "Charisme naturel, généreux et fédérateur, porté par la scène et l'enthousiasme.",
    description:
      "Votre présence remplit la pièce. Naturellement chaleureux, vous avez le don de captiver une tablée avec une anecdote bien racontée. Vous êtes d'une générosité sans bornes envers vos amis, tant que vous gardez une petite place au centre du tableau.",
    superpower: "Charisme magnétique capable d'inspirer, de motiver et d'unir un groupe disparate.",
    blindSpot: "Susceptibilité accrue face à l'indifférence ou au sentiment de ne pas être reconnu à sa juste valeur.",
    partySurvival: "Porte les toasts, choisit les jeux d'ambiance et garde la lumière allumée jusqu'au bout.",
    idealPair: {
      id: "diplomate",
      name: "Le Diplomate Suisse",
      reason: "Ils préparent le terrain pour que vous puissiez briller en harmonie avec tous.",
    },
    nemesisPair: {
      id: "stratege",
      name: "Le Stratège Machiavélique",
      reason: "Vous sentez confusément qu'ils tirent des ficelles dans votre dos.",
    },
    color: "#d97706",
    kawaiiTheme: "party",
  },
};

export interface PsychoQuestionOption {
  text: string;
  archetypes: Partial<Record<PsychoArchetypeId, number>>;
  axes: {
    audace: number; // -2 à +2
    empathie: number; // -2 à +2
    ordre: number; // -2 à +2
    idealisme: number; // -2 à +2
  };
}

export interface PsychoQuestion {
  id: string;
  theme: string;
  situation: string;
  options: [
    PsychoQuestionOption,
    PsychoQuestionOption,
    PsychoQuestionOption,
    PsychoQuestionOption,
  ];
}

export const PSYCHO_QUESTIONS: PsychoQuestion[] = [
  {
    id: "q1",
    theme: "Le Secret Indiscret",
    situation: "Vous apprenez par hasard un secret très embarrassant sur un ami proche. Comment réagissez-vous ?",
    options: [
      {
        text: "Je le garde scellé au fond de moi sans jamais en parler à qui que ce soit.",
        archetypes: { protecteur: 3, diplomate: 1 },
        axes: { audace: -1, empathie: 2, ordre: 1, idealisme: 2 },
      },
      {
        text: "Je vais le voir en tête-à-tête pour lui dire avec tact que je sais, pour l'aider.",
        archetypes: { diplomate: 3, analyste: 1 },
        axes: { audace: 1, empathie: 2, ordre: 1, idealisme: 1 },
      },
      {
        text: "J'analyse si cette information peut être utile pour débloquer une situation future.",
        archetypes: { stratege: 3, analyste: 1 },
        axes: { audace: 0, empathie: -2, ordre: 1, idealisme: -2 },
      },
      {
        text: "Je lâche une pique énigmatique en public juste pour voir sa réaction se décomposer.",
        archetypes: { chaos: 3, franc_tireur: 1 },
        axes: { audace: 2, empathie: -2, ordre: -2, idealisme: -1 },
      },
    ],
  },
  {
    id: "q2",
    theme: "L'Addition au Restaurant",
    situation: "À 8 au restaurant, quelqu'un propose de diviser la note à parts égales alors qu'il a pris caviar et cocktails hors de prix.",
    options: [
      {
        text: "Je prends immédiatement la parole à voix haute : 'Chacun paye ce qu'il a consommé.'",
        archetypes: { franc_tireur: 3, analyste: 1 },
        axes: { audace: 2, empathie: -1, ordre: 1, idealisme: 2 },
      },
      {
        text: "Je sors ma calculette en silence et annonce le montant exact au centime près.",
        archetypes: { analyste: 3, stratege: 1 },
        axes: { audace: 0, empathie: -1, ordre: 2, idealisme: 1 },
      },
      {
        text: "Je paie sans rien dire pour éviter tout malaise, quitte à bouillir intérieurement.",
        archetypes: { diplomate: 3, cameleon: 1 },
        axes: { audace: -2, empathie: 1, ordre: -1, idealisme: -1 },
      },
      {
        text: "Je propose de commander une tournée de digestifs exorbitants pour rééquilibrer le chaos.",
        archetypes: { chaos: 3, roi_soleil: 1 },
        axes: { audace: 2, empathie: 0, ordre: -2, idealisme: -2 },
      },
    ],
  },
  {
    id: "q3",
    theme: "Jeu de Société Compétitif",
    situation: "Pendant une partie de Loup-Garou ou Monopoly, vous devez trahir votre meilleur ami pour remporter la victoire.",
    options: [
      {
        text: "Je le trahis froidement avec un grand sourire : le jeu est le jeu, place au spectacle !",
        archetypes: { stratege: 3, chaos: 1 },
        axes: { audace: 1, empathie: -2, ordre: 1, idealisme: -2 },
      },
      {
        text: "Impossible, je préfère perdre la partie plutôt que d'enfoncer mon allié.",
        archetypes: { protecteur: 3, diplomate: 1 },
        axes: { audace: -1, empathie: 2, ordre: 0, idealisme: 2 },
      },
      {
        text: "J'invente un bluff rocambolesque qui nous propulse tous les deux au sommet.",
        archetypes: { cameleon: 3, roi_soleil: 1 },
        axes: { audace: 2, empathie: 1, ordre: -1, idealisme: 0 },
      },
      {
        text: "Je détaille rationnellement pourquoi mon coup est la seule issue mathématiquement viable.",
        archetypes: { analyste: 3, franc_tireur: 1 },
        axes: { audace: 1, empathie: -1, ordre: 2, idealisme: 0 },
      },
    ],
  },
  {
    id: "q4",
    theme: "L'Embrouille en Soirée",
    situation: "Une altercation éclate entre un ami et un inconnu agressif au bar. Votre réflexe ?",
    options: [
      {
        text: "Je m'interpose physiquement entre eux immédiatement pour protéger mon ami.",
        archetypes: { protecteur: 3, franc_tireur: 1 },
        axes: { audace: 2, empathie: 2, ordre: 0, idealisme: 1 },
      },
      {
        text: "Je désamorce la situation avec le sourire, une blague et un verre offert à l'inconnu.",
        archetypes: { diplomate: 3, cameleon: 1 },
        axes: { audace: 1, empathie: 2, ordre: 1, idealisme: 1 },
      },
      {
        text: "Je fais signe discrètement au videur tout en évaluant les issues de secours.",
        archetypes: { stratege: 3, analyste: 1 },
        axes: { audace: -1, empathie: 0, ordre: 2, idealisme: 0 },
      },
      {
        text: "J'envoie une punchline dévastatrice qui retourne tout le bar en notre faveur.",
        archetypes: { roi_soleil: 2, chaos: 2 },
        axes: { audace: 2, empathie: -1, ordre: -2, idealisme: -1 },
      },
    ],
  },
  {
    id: "q5",
    theme: "Le Projet en Péril",
    situation: "C'est la veille du rendu d'un projet de groupe important, et deux membres n'ont rien fait.",
    options: [
      {
        text: "Je refais tout moi-même dans la nuit pour que le travail soit impeccable.",
        archetypes: { analyste: 2, protecteur: 2 },
        axes: { audace: 0, empathie: 1, ordre: 2, idealisme: 1 },
      },
      {
        text: "Je négocie un délai avec le prof tout en manageant les retardataires avec fermeté.",
        archetypes: { diplomate: 2, roi_soleil: 2 },
        axes: { audace: 1, empathie: 1, ordre: 1, idealisme: 0 },
      },
      {
        text: "Je présente le projet en mentionnant explicitement qui a travaillé et qui n'a rien fait.",
        archetypes: { franc_tireur: 3, stratege: 1 },
        axes: { audace: 2, empathie: -2, ordre: 1, idealisme: 2 },
      },
      {
        text: "J'improvise une présentation théâtrale pour masquer le vide avec un aplomb légendaire.",
        archetypes: { cameleon: 3, chaos: 1 },
        axes: { audace: 2, empathie: 0, ordre: -2, idealisme: -2 },
      },
    ],
  },
  {
    id: "q6",
    theme: "Le Cadeau Affreux",
    situation: "Un proche vous offre un vêtement particulièrement hideux avec des étoiles dans les yeux.",
    options: [
      {
        text: "Je simule une joie intense et je le porte au moins une fois pour lui faire plaisir.",
        archetypes: { cameleon: 3, diplomate: 1 },
        axes: { audace: -1, empathie: 2, ordre: 0, idealisme: -1 },
      },
      {
        text: "Je souris et je le remercie sincèrement pour l'attention, même si je ne le porterai jamais.",
        archetypes: { diplomate: 3, protecteur: 1 },
        axes: { audace: -1, empathie: 2, ordre: 1, idealisme: 0 },
      },
      {
        text: "J'éclate de rire et je lui demande immédiatement où il est allé dénicher cette pépite.",
        archetypes: { chaos: 3, franc_tireur: 1 },
        axes: { audace: 2, empathie: 0, ordre: -1, idealisme: 1 },
      },
      {
        text: "Je lui explique avec affection pourquoi ce n'est pas mon style pour trouver un échange.",
        archetypes: { analyste: 2, franc_tireur: 2 },
        axes: { audace: 1, empathie: 0, ordre: 1, idealisme: 2 },
      },
    ],
  },
  {
    id: "q7",
    theme: "Le Dilemme du Billet Trouvé",
    situation: "Vous trouvez un billet de 100 € par terre dans un café bondé. Que faites-vous ?",
    options: [
      {
        text: "Je demande à voix haute à qui appartient ce billet pour le rendre au propriétaire.",
        archetypes: { protecteur: 2, diplomate: 2 },
        axes: { audace: 1, empathie: 2, ordre: 1, idealisme: 2 },
      },
      {
        text: "Je le glisse dans ma poche en observant les caméras. C'est la règle du jeu de la vie.",
        archetypes: { stratege: 3, analyste: 1 },
        axes: { audace: 0, empathie: -2, ordre: 0, idealisme: -2 },
      },
      {
        text: "Je l'utilise immédiatement pour payer une tournée générale à ma table.",
        archetypes: { roi_soleil: 3, chaos: 1 },
        axes: { audace: 2, empathie: 1, ordre: -2, idealisme: 0 },
      },
      {
        text: "Je le donne au serveur comme pourboire généreux pour faire sa journée.",
        archetypes: { diplomate: 2, cameleon: 2 },
        axes: { audace: 0, empathie: 2, ordre: 0, idealisme: 1 },
      },
    ],
  },
  {
    id: "q8",
    theme: "L'Ami qui Raconte des Craques",
    situation: "En soirée, un ami enjolive outrageusement une anecdote pour impressionner son auditoire.",
    options: [
      {
        text: "Je rentre dans son jeu et j'ajoute un détail encore plus délirant pour l'épauler.",
        archetypes: { cameleon: 2, roi_soleil: 2 },
        axes: { audace: 1, empathie: 1, ordre: -1, idealisme: -1 },
      },
      {
        text: "Je le regarde avec un petit sourire complice sans le griller en public.",
        archetypes: { diplomate: 2, protecteur: 2 },
        axes: { audace: -1, empathie: 2, ordre: 1, idealisme: 0 },
      },
      {
        text: "Je rétablis froidement les faits : 'Attends, c'est pas du tout ce qui s'est passé !'",
        archetypes: { franc_tireur: 3, analyste: 1 },
        axes: { audace: 2, empathie: -2, ordre: 1, idealisme: 2 },
      },
      {
        text: "Je note mentalement sa tendance à la fabulation pour mes futures interactions avec lui.",
        archetypes: { analyste: 3, stratege: 1 },
        axes: { audace: -1, empathie: -1, ordre: 2, idealisme: 0 },
      },
    ],
  },
  {
    id: "q9",
    theme: "Organisation des Vacances",
    situation: "Votre groupe d'amis prépare un voyage d'une semaine. Votre rôle spontané ?",
    options: [
      {
        text: "Le tableur Excel avec budget, réservations et itinéraires optimisés.",
        archetypes: { analyste: 3, stratege: 1 },
        axes: { audace: -1, empathie: 0, ordre: 2, idealisme: 0 },
      },
      {
        text: "L'ambianceur qui repère les meilleurs spots de fête, bars et rooftops.",
        archetypes: { roi_soleil: 3, chaos: 1 },
        axes: { audace: 2, empathie: 1, ordre: -2, idealisme: 0 },
      },
      {
        text: "Le médiateur qui concilie les envies de ceux qui veulent dormir et ceux qui veulent bouger.",
        archetypes: { diplomate: 3, protecteur: 1 },
        axes: { audace: -1, empathie: 2, ordre: 1, idealisme: 1 },
      },
      {
        text: "Le franc-tireur qui part explorer la ville en solo dès que le groupe traîne trop.",
        archetypes: { franc_tireur: 3, chaos: 1 },
        axes: { audace: 2, empathie: -1, ordre: -1, idealisme: 0 },
      },
    ],
  },
  {
    id: "q10",
    theme: "Le Message au Mauvais Destinataire",
    situation: "Vous critiquez quelqu'un par texto... et vous envoyez le message à la personne concernée par erreur !",
    options: [
      {
        text: "J'assume immédiatement mes propos par un coup de fil direct : 'Parlons-en franchement.'",
        archetypes: { franc_tireur: 3, protecteur: 1 },
        axes: { audace: 2, empathie: 0, ordre: 1, idealisme: 2 },
      },
      {
        text: "J'invente un prétexte technique rocambolesque : piratage, correction automatique folle.",
        archetypes: { cameleon: 3, chaos: 1 },
        axes: { audace: 1, empathie: -1, ordre: -2, idealisme: -2 },
      },
      {
        text: "Je présente des excuses sincères et nuancées en expliquant le contexte de mon énervement.",
        archetypes: { diplomate: 3, protecteur: 1 },
        axes: { audace: 0, empathie: 2, ordre: 1, idealisme: 1 },
      },
      {
        text: "Je calcule comment retourner la situation pour mettre en lumière un problème de fond.",
        archetypes: { stratege: 3, analyste: 1 },
        axes: { audace: 1, empathie: -1, ordre: 2, idealisme: -1 },
      },
    ],
  },
  {
    id: "q11",
    theme: "L'Apocalypse Zombie",
    situation: "L'effondrement commence. Quelle est votre première décision de survie ?",
    options: [
      {
        text: "Je fortifie mon refuge et je n'ouvre qu'aux personnes rigoureusement sélectionnées.",
        archetypes: { stratege: 3, protecteur: 1 },
        axes: { audace: 0, empathie: -1, ordre: 2, idealisme: -1 },
      },
      {
        text: "Je rassemble toute ma bande coûte que coûte, personne n'est laissé derrière.",
        archetypes: { protecteur: 3, roi_soleil: 1 },
        axes: { audace: 1, empathie: 2, ordre: 1, idealisme: 2 },
      },
      {
        text: "Je prends un sac à dos léger et je pars en solitaire sur les routes secondaires.",
        archetypes: { franc_tireur: 3, analyste: 1 },
        axes: { audace: 2, empathie: -2, ordre: -1, idealisme: 0 },
      },
      {
        text: "Je monte un campement communautaire avec des règles claires et un esprit de fête.",
        archetypes: { roi_soleil: 2, diplomate: 2 },
        axes: { audace: 1, empathie: 2, ordre: 0, idealisme: 1 },
      },
    ],
  },
  {
    id: "q12",
    theme: "La Notoriété et la Gloire",
    situation: "On vous propose d'être très célèbre, mais 30% du public vous détestera viscéralement.",
    options: [
      {
        text: "J'accepte sans hésiter : qu'on parle de moi en bien ou en mal, tant que je suis au sommet !",
        archetypes: { roi_soleil: 3, chaos: 1 },
        axes: { audace: 2, empathie: -1, ordre: -1, idealisme: -1 },
      },
      {
        text: "Je refuse : la tranquillité d'esprit et l'anonymat auprès des miens n'ont pas de prix.",
        archetypes: { protecteur: 2, diplomate: 2 },
        axes: { audace: -2, empathie: 2, ordre: 1, idealisme: 1 },
      },
      {
        text: "J'accepte si cette visibilité me permet d'accomplir un projet colossal précis.",
        archetypes: { stratege: 2, franc_tireur: 2 },
        axes: { audace: 1, empathie: -1, ordre: 1, idealisme: 1 },
      },
      {
        text: "J'analyse la rentabilité financière et les retombées statistiques avant de signer.",
        archetypes: { analyste: 3, cameleon: 1 },
        axes: { audace: 0, empathie: -2, ordre: 2, idealisme: -2 },
      },
    ],
  },
  {
    id: "q13",
    theme: "Le Désaccord Politique en Famille",
    situation: "Au repas de famille, un oncle lance un débat houleux avec lequel vous êtes en désaccord total.",
    options: [
      {
        text: "Je réponds point par point avec des chiffres irréfutables jusqu'à ce qu'il se taise.",
        archetypes: { analyste: 3, franc_tireur: 1 },
        axes: { audace: 1, empathie: -1, ordre: 2, idealisme: 1 },
      },
      {
        text: "Je change subtilement de sujet en complimentant le rôti pour préserver le calme.",
        archetypes: { diplomate: 3, cameleon: 1 },
        axes: { audace: -2, empathie: 2, ordre: 1, idealisme: -1 },
      },
      {
        text: "Je jette de l'huile sur le feu en posant une question encore plus polémique pour rigoler.",
        archetypes: { chaos: 3, roi_soleil: 1 },
        axes: { audace: 2, empathie: -2, ordre: -2, idealisme: -2 },
      },
      {
        text: "Je défends les plus vulnérables de la table qui se sentent oppressés par ses propos.",
        archetypes: { protecteur: 3, franc_tireur: 1 },
        axes: { audace: 1, empathie: 2, ordre: 0, idealisme: 2 },
      },
    ],
  },
  {
    id: "q14",
    theme: "L'Échec Public",
    situation: "Vous vous plantez lamentablement lors d'une prise de parole devant 50 personnes.",
    options: [
      {
        text: "Je désamorce immédiatement par l'autodérision : toute la salle rit avec moi.",
        archetypes: { cameleon: 2, roi_soleil: 2 },
        axes: { audace: 2, empathie: 1, ordre: -1, idealisme: 0 },
      },
      {
        text: "Je décortique froidement chaque erreur pour faire un sans-faute la prochaine fois.",
        archetypes: { analyste: 3, stratege: 1 },
        axes: { audace: 0, empathie: -1, ordre: 2, idealisme: 1 },
      },
      {
        text: "Je m'en fiche complètement : ceux qui ne font rien ne se trompent jamais.",
        archetypes: { franc_tireur: 3, chaos: 1 },
        axes: { audace: 2, empathie: 0, ordre: -1, idealisme: 1 },
      },
      {
        text: "Je cherche le regard rassurant de mes amis dans la salle pour me reconnecter.",
        archetypes: { protecteur: 2, diplomate: 2 },
        axes: { audace: -1, empathie: 2, ordre: 0, idealisme: 1 },
      },
    ],
  },
  {
    id: "q15",
    theme: "La Vengeance",
    situation: "Quelqu'un vous a fait un coup bas volontaire il y a quelques mois. Une occasion de lui rendre la pareille se présente.",
    options: [
      {
        text: "La vengeance est un plat qui se mange glacé : je frappe avec précision chirurgicale.",
        archetypes: { stratege: 3, franc_tireur: 1 },
        axes: { audace: 1, empathie: -2, ordre: 1, idealisme: -2 },
      },
      {
        text: "Je laisse couler : le karma s'en chargera, je ne m'abaisse pas à son niveau.",
        archetypes: { diplomate: 2, protecteur: 2 },
        axes: { audace: -1, empathie: 2, ordre: 1, idealisme: 2 },
      },
      {
        text: "Je lui fais une farce publique humiliante mais sans gravité matérielle.",
        archetypes: { chaos: 3, cameleon: 1 },
        axes: { audace: 2, empathie: -1, ordre: -2, idealisme: -1 },
      },
      {
        text: "Je vais le voir en face et lui dis que je pourrais le détruire, mais que je choisis de ne pas le faire.",
        archetypes: { roi_soleil: 2, franc_tireur: 2 },
        axes: { audace: 2, empathie: 0, ordre: 0, idealisme: 1 },
      },
    ],
  },
  {
    id: "q16",
    theme: "Le Grand Changement",
    situation: "Votre vie actuelle est confortable mais monotone. Une opportunité excitante mais très risquée apparaît.",
    options: [
      {
        text: "Je saute le pas sans hésiter : la vie est trop courte pour être tiède !",
        archetypes: { franc_tireur: 3, chaos: 1 },
        axes: { audace: 2, empathie: 0, ordre: -2, idealisme: 1 },
      },
      {
        text: "Je prépare une transition méthodique sur 6 mois pour minimiser chaque aléa.",
        archetypes: { stratege: 3, analyste: 1 },
        axes: { audace: 0, empathie: 0, ordre: 2, idealisme: 0 },
      },
      {
        text: "Je consulte mes proches : leur avis et leur bien-être priment sur mes ambitions.",
        archetypes: { protecteur: 3, diplomate: 1 },
        axes: { audace: -1, empathie: 2, ordre: 1, idealisme: 1 },
      },
      {
        text: "Je tente de négocier pour garder le beurre et l'argent du beurre.",
        archetypes: { cameleon: 2, roi_soleil: 2 },
        axes: { audace: 1, empathie: -1, ordre: -1, idealisme: -1 },
      },
    ],
  },
  {
    id: "q17",
    theme: "La Confiance en Soi",
    situation: "Dans une réunion où personne n'ose prendre la parole, que ressentez-vous ?",
    options: [
      {
        text: "Une irrésistible envie de briser le silence et d'impulser la direction.",
        archetypes: { roi_soleil: 3, franc_tireur: 1 },
        axes: { audace: 2, empathie: 0, ordre: 0, idealisme: 0 },
      },
      {
        text: "J'observe la dynamique des regards pour comprendre les rapports de force cachés.",
        archetypes: { analyste: 2, stratege: 2 },
        axes: { audace: -1, empathie: -1, ordre: 2, idealisme: 0 },
      },
      {
        text: "Je pose une question ouverte et bienveillante pour aider quelqu'un d'autre à démarrer.",
        archetypes: { diplomate: 3, protecteur: 1 },
        axes: { audace: 0, empathie: 2, ordre: 1, idealisme: 1 },
      },
      {
        text: "Je fais une remarque décalée pour désinhiber tout le monde d'un coup.",
        archetypes: { chaos: 3, cameleon: 1 },
        axes: { audace: 2, empathie: 1, ordre: -2, idealisme: -1 },
      },
    ],
  },
  {
    id: "q18",
    theme: "Le Testament Moral",
    situation: "À la fin de votre existence, que souhaitez-vous que vos proches retiennent avant tout de vous ?",
    options: [
      {
        text: "« Avec cette personne, on ne s'est jamais ennuyé une seule seconde. »",
        archetypes: { chaos: 2, roi_soleil: 2 },
        axes: { audace: 2, empathie: 0, ordre: -2, idealisme: 0 },
      },
      {
        text: "« C'était le roc sur lequel on pouvait toujours compter les yeux fermés. »",
        archetypes: { protecteur: 3, diplomate: 1 },
        axes: { audace: 0, empathie: 2, ordre: 2, idealisme: 2 },
      },
      {
        text: "« Une intelligence redoutable qui a marqué son époque selon ses propres règles. »",
        archetypes: { stratege: 2, franc_tireur: 2 },
        axes: { audace: 1, empathie: -1, ordre: 1, idealisme: 0 },
      },
      {
        text: "« Quelqu'un d'une lucidité rare qui a su apporter de la paix autour de lui. »",
        archetypes: { analyste: 2, diplomate: 2 },
        axes: { audace: -1, empathie: 2, ordre: 1, idealisme: 1 },
      },
    ],
  },
];
