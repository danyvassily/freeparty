# -*- coding: utf-8 -*-
"""Questions MYTHOLOGIE GRECQUE — Olympiens, Titans, symboles/attributs.
Format: (conceptId, familyId, subcategory, difficulty, question, (bonne, d1, d2, d3), tags, sourceQ, confidence, qualityScore, category, filename)
La bonne réponse est TOUJOURS la première du tuple.
"""
CAT = "mythologie-grecque"

QUESTIONS = [
    # ---------------- OLYMPIENS (42) ----------------
    ("zeus-king-of-gods", "zeus-king", "olympiens", "easy",
     "Qui est le roi des dieux dans la mythologie grecque ?",
     ("Zeus", "Poséidon", "Hadès", "Arès"),
     ["mythologie-grecque", "zeus"], "Q34201", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("zeus-thunderbolt-attribute", "zeus-attributes", "olympiens", "easy",
     "Quel est l'attribut le plus célèbre de Zeus ?",
     ("La foudre", "Le trident", "Le caducée", "La lyre"),
     ["mythologie-grecque", "zeus"], "Q34201", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("zeus-wife-hera", "zeus-family", "olympiens", "easy",
     "Qui est l'épouse de Zeus ?",
     ("Héra", "Athéna", "Aphrodite", "Déméter"),
     ["mythologie-grecque", "zeus"], "Q34201", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("zeus-son-of-cronos", "zeus-family", "olympiens", "medium",
     "De quel Titan Zeus est-il le fils ?",
     ("Cronos", "Ouranos", "Océan", "Japet"),
     ["mythologie-grecque", "zeus"], "Q34201", 0.97, 0.93, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("zeus-twins-leto", "zeus-children", "olympiens", "medium",
     "De qui Zeus et Léto sont-ils les parents ?",
     ("Apollon et Artémis", "Arès et Héphaïstos", "Hermès et Dionysos", "Athéna et Perséphone"),
     ["mythologie-grecque", "zeus"], "Q34201", 0.97, 0.94, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("olympus-home-of-gods", "olympus", "olympiens", "easy",
     "Où résident les dieux de l'Olympe ?",
     ("Sur le mont Olympe", "Sur le Parnasse", "Sur le mont Ida", "Sur l'Etna"),
     ["mythologie-grecque", "olympe"], "Q131148", 0.97, 0.94, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hera-goddess-of-marriage", "hera-functions", "olympiens", "medium",
     "Quelle est la fonction principale de la déesse Héra ?",
     ("Protéger le mariage et les femmes mariées", "Présider la guerre", "Veiller sur les moissons", "Guider les voyageurs"),
     ["mythologie-grecque", "hera"], "Q47602", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hera-attribute-peacock", "hera-attributes", "olympiens", "hard",
     "Quel animal est traditionnellement associé à Héra ?",
     ("Le paon", "Le dauphin", "Le corbeau", "Le lion"),
     ["mythologie-grecque", "hera"], "Q47602", 0.97, 0.93, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hera-jealousy-myths", "hera-myths", "olympiens", "medium",
     "Pourquoi Héra est-elle souvent représentée comme jalouse dans les mythes ?",
     ("À cause des infidélités de Zeus", "Parce qu'elle a perdu un concours de beauté", "Parce qu'elle est la déesse de l'envie", "Parce qu'elle fut chassée de l'Olympe"),
     ["mythologie-grecque", "hera"], "Q47602", 0.97, 0.92, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("poseidon-god-of-the-sea", "poseidon-functions", "olympiens", "easy",
     "Qui est le dieu de la mer dans la mythologie grecque ?",
     ("Poséidon", "Hadès", "Apollon", "Arès"),
     ["mythologie-grecque", "poseidon"], "Q41127", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("poseidon-trident-attribute", "poseidon-attributes", "olympiens", "easy",
     "Quel est l'attribut de Poséidon ?",
     ("Le trident", "La foudre", "L'arc", "Le caducée"),
     ["mythologie-grecque", "poseidon"], "Q41127", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("poseidon-earthquakes-horses", "poseidon-functions", "olympiens", "hard",
     "Outre la mer, à quoi Poséidon est-il aussi associé ?",
     ("Aux séismes et aux chevaux", "À la musique et à la poésie", "Au vin et aux banquets", "À la guerre et au sang"),
     ["mythologie-grecque", "poseidon"], "Q41127", 0.96, 0.92, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hades-god-of-underworld", "hades-functions", "olympiens", "easy",
     "Quel dieu règne sur les Enfers ?",
     ("Hadès", "Thanatos", "Charon", "Zeus"),
     ["mythologie-grecque", "hades"], "Q41410", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hades-wife-persephone", "hades-family", "olympiens", "medium",
     "Qui est l'épouse d'Hadès ?",
     ("Perséphone", "Hélène", "Eurydice", "Andromède"),
     ["mythologie-grecque", "hades"], "Q41410", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hades-helm-of-darkness", "hades-attributes", "olympiens", "hard",
     "Quel objet magique possède Hadès ?",
     ("Un casque qui rend invisible", "Des sandales ailées", "Une lyre enchantée", "Un bouclier de bronze"),
     ["mythologie-grecque", "hades"], "Q41410", 0.96, 0.92, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("thanatos-personification-of-death", "hades-vs-thanatos", "olympiens", "expert",
     "Qui est la personnification de la mort dans la mythologie grecque ?",
     ("Thanatos", "Hadès", "Charon", "Hypnos"),
     ["mythologie-grecque", "hades"], "Q134959", 0.95, 0.90, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("athena-goddess-of-wisdom", "athena-functions", "olympiens", "easy",
     "Quelle déesse grecque est associée à la sagesse ?",
     ("Athéna", "Aphrodite", "Artémis", "Hestia"),
     ["mythologie-grecque", "athena"], "Q37122", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("athena-born-from-zeus-head", "athena-birth", "olympiens", "medium",
     "Selon la tradition la plus répandue, comment Athéna est-elle née ?",
     ("Sortie tout armée de la tête de Zeus", "Née de l'écume de la mer", "Créée par Héphaïstos", "Née d'un œuf de cygne"),
     ["mythologie-grecque", "athena"], "Q37122", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("athena-patron-of-athens", "athena-myths", "olympiens", "medium",
     "Quelle ville a été placée sous la protection d'Athéna ?",
     ("Athènes", "Sparte", "Thèbes", "Corinthe"),
     ["mythologie-grecque", "athena"], "Q37122", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("athena-owl-attribute", "athena-attributes", "olympiens", "easy",
     "Quel animal est le symbole d'Athéna ?",
     ("La chouette", "Le paon", "L'aigle", "Le corbeau"),
     ["mythologie-grecque", "athena"], "Q37122", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("apollo-god-of-arts", "apollo-functions", "olympiens", "easy",
     "Quel dieu est le patron de la musique et de la poésie ?",
     ("Apollon", "Arès", "Héphaïstos", "Poséidon"),
     ["mythologie-grecque", "apollon"], "Q37340", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("apollo-oracle-of-delphi", "apollo-functions", "olympiens", "medium",
     "Quel dieu est honoré par l'oracle de Delphes ?",
     ("Apollon", "Zeus", "Hermès", "Dionysos"),
     ["mythologie-grecque", "apollon"], "Q37340", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("apollo-twin-of-artemis", "apollo-family", "olympiens", "hard",
     "Qui est la sœur jumelle d'Apollon ?",
     ("Artémis", "Athéna", "Aphrodite", "Hélène"),
     ["mythologie-grecque", "apollon"], "Q37340", 0.98, 0.94, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("apollo-lyre-attribute", "apollo-attributes", "olympiens", "easy",
     "Quel instrument de musique est l'attribut d'Apollon ?",
     ("La lyre", "La flûte de Pan", "La trompette", "Le tambourin"),
     ["mythologie-grecque", "apollon"], "Q37340", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("artemis-goddess-of-hunting", "artemis-functions", "olympiens", "easy",
     "Quelle déesse est la déesse de la chasse ?",
     ("Artémis", "Athéna", "Aphrodite", "Déméter"),
     ["mythologie-grecque", "artemis"], "Q39503", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("artemis-moon-goddess", "artemis-functions", "olympiens", "medium",
     "À quel astre Artémis est-elle également associée ?",
     ("À la Lune", "Au Soleil", "Aux étoiles", "À une comète"),
     ["mythologie-grecque", "artemis"], "Q39503", 0.97, 0.94, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("ares-god-of-war", "ares-functions", "olympiens", "easy",
     "Qui est le dieu de la guerre dans la mythologie grecque ?",
     ("Arès", "Apollon", "Hermès", "Héphaïstos"),
     ["mythologie-grecque", "ares"], "Q107639", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("ares-aphrodite-affair", "ares-myths", "olympiens", "hard",
     "Quelle déesse est la compagne la plus célèbre d'Arès ?",
     ("Aphrodite", "Héra", "Athéna", "Artémis"),
     ["mythologie-grecque", "ares"], "Q107639", 0.97, 0.93, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("aphrodite-goddess-of-love", "aphrodite-functions", "olympiens", "easy",
     "Quelle déesse incarne l'amour et la beauté ?",
     ("Aphrodite", "Héra", "Déméter", "Hestia"),
     ["mythologie-grecque", "aphrodite"], "Q35500", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("aphrodite-born-from-sea-foam", "aphrodite-birth", "olympiens", "medium",
     "Selon la tradition la plus répandue, d'où naît Aphrodite ?",
     ("De l'écume de la mer", "De la tête de Zeus", "D'une goutte de sang de Cronos tombée sur terre", "D'un œuf cosmique"),
     ["mythologie-grecque", "aphrodite"], "Q35500", 0.97, 0.93, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("aphrodite-wife-of-hephaestus", "aphrodite-family", "olympiens", "hard",
     "Qui est l'époux légitime d'Aphrodite ?",
     ("Héphaïstos", "Arès", "Apollon", "Hermès"),
     ["mythologie-grecque", "aphrodite"], "Q35500", 0.97, 0.93, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("aphrodite-dove-attribute", "aphrodite-attributes", "olympiens", "medium",
     "Quel oiseau est associé à Aphrodite ?",
     ("La colombe", "L'aigle", "Le faucon", "La pie"),
     ["mythologie-grecque", "aphrodite"], "Q35500", 0.97, 0.94, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hermes-messenger-of-the-gods", "hermes-functions", "olympiens", "easy",
     "Qui est le messager des dieux grecs ?",
     ("Hermès", "Apollon", "Arès", "Dionysos"),
     ["mythologie-grecque", "hermes"], "Q41492", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hermes-caduceus-attribute", "hermes-attributes", "olympiens", "medium",
     "Quel est l'attribut de Hermès ?",
     ("Le caducée", "Le trident", "La massue", "Le thyrse"),
     ["mythologie-grecque", "hermes"], "Q41492", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hermes-psychopomp", "hermes-functions", "olympiens", "expert",
     "Quel rôle Hermès joue-t-il auprès des morts ?",
     ("Il conduit les âmes vers les Enfers", "Il juge les âmes", "Il garde les portes des Enfers", "Il punit les criminels"),
     ["mythologie-grecque", "hermes"], "Q41492", 0.96, 0.91, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hephaestus-god-of-forge", "hephaestus-functions", "olympiens", "easy",
     "Quel dieu est le forgeron de l'Olympe ?",
     ("Héphaïstos", "Zeus", "Arès", "Apollon"),
     ["mythologie-grecque", "hephaistos"], "Q130303", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hephaestus-lame", "hephaestus-myths", "olympiens", "hard",
     "Quelle particularité physique Héphaïstos a-t-il ?",
     ("Il boite", "Il est aveugle", "Il est muet", "Il est sourd"),
     ["mythologie-grecque", "hephaistos"], "Q130303", 0.97, 0.94, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("demeter-goddess-of-agriculture", "demeter-functions", "olympiens", "easy",
     "Quelle déesse préside à l'agriculture et aux moissons ?",
     ("Déméter", "Athéna", "Héra", "Artémis"),
     ["mythologie-grecque", "demeter"], "Q40714", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("dionysus-god-of-wine", "dionysus-functions", "olympiens", "easy",
     "Qui est le dieu du vin et de la fête ?",
     ("Dionysos", "Apollon", "Hermès", "Poséidon"),
     ["mythologie-grecque", "dionysos"], "Q44212", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("dionysus-born-from-zeus-thigh", "dionysus-birth", "olympiens", "hard",
     "Selon le mythe le plus répandu, d'où Zeus a-t-il fait naître Dionysos ?",
     ("De sa cuisse", "De sa tête", "De son oreille", "De son pied"),
     ["mythologie-grecque", "dionysos"], "Q44212", 0.97, 0.93, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("hestia-goddess-of-hearth", "hestia-functions", "olympiens", "medium",
     "Quelle est la fonction de la déesse Hestia ?",
     ("Gardienne du foyer et du feu sacré", "Déesse de la chasse", "Déesse des moissons", "Déesse de la sagesse"),
     ["mythologie-grecque", "hestia"], "Q41669", 0.97, 0.94, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    ("persephone-queen-of-underworld", "persephone-functions", "olympiens", "medium",
     "Quelle déesse est la reine des Enfers aux côtés d'Hadès ?",
     ("Perséphone", "Hélène", "Eurydice", "Cassandre"),
     ["mythologie-grecque", "persephone"], "Q43120", 0.98, 0.95, CAT, "mythologie-grecque/grecque-olympiens-001.json"),

    # ---------------- TITANS (18) ----------------
    ("titans-parents-ouranos-gaia", "titans-genealogy", "titans", "medium",
     "Qui sont les parents des Titans ?",
     ("Ouranos et Gaïa", "Cronos et Rhéa", "Zeus et Héra", "Océan et Téthys"),
     ["mythologie-grecque", "titans"], "Q159367", 0.97, 0.94, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("cronos-overthrows-ouranos", "titanomachy-origins", "titans", "hard",
     "Qui a détrôné Ouranos, le dieu du Ciel ?",
     ("Cronos", "Zeus", "Prométhée", "Atlas"),
     ["mythologie-grecque", "titans"], "Q159367", 0.96, 0.92, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("cronos-devours-children", "cronos-myth", "titans", "hard",
     "Que faisait Cronos de ses enfants à leur naissance ?",
     ("Il les dévorait", "Il les jetait dans le Tartare", "Il les transformait en pierres", "Il les abandonnait sur le mont Ida"),
     ["mythologie-grecque", "titans"], "Q159367", 0.97, 0.93, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("rhea-saves-zeus", "cronos-myth", "titans", "hard",
     "Comment Rhéa a-t-elle sauvé Zeus de Cronos ?",
     ("En donnant à Cronos une pierre emmaillotée à la place du bébé", "En le cachant dans une jarre", "En le confiant aux Nymphes de la mer", "En le faisant disparaître dans le Tartare"),
     ["mythologie-grecque", "titans"], "Q159367", 0.97, 0.93, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("titanomachy-war", "titanomachy", "titans", "medium",
     "Comment s'appelle la guerre qui oppose les dieux de l'Olympe aux Titans ?",
     ("La Titanomachie", "La Gigantomachie", "La Guerre de Troie", "La Théomachie"),
     ["mythologie-grecque", "titans"], "Q34201", 0.97, 0.94, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("prometheus-steals-fire", "prometheus-myth", "titans", "easy",
     "Quel Titan a dérobé le feu aux dieux pour l'offrir aux humains ?",
     ("Prométhée", "Atlas", "Cronos", "Épiméthée"),
     ["mythologie-grecque", "titans"], "Q50613", 0.98, 0.95, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("prometheus-punishment-eagle", "prometheus-punishment", "titans", "medium",
     "Quelle est la punition de Prométhée ?",
     ("Un aigle lui dévore le foie chaque jour", "Il est changé en rocher", "Il est précipité dans le Tartare", "Il tire le char du Soleil"),
     ["mythologie-grecque", "titans"], "Q50613", 0.98, 0.95, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("prometheus-freed-by-heracles", "prometheus-punishment", "titans", "expert",
     "Qui finit par libérer Prométhée de son supplice ?",
     ("Héraclès", "Thésée", "Orphée", "Ulysse"),
     ["mythologie-grecque", "titans"], "Q50613", 0.96, 0.91, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("atlas-holds-up-the-sky", "atlas-punishment", "titans", "easy",
     "Quel Titan est condamné à porter le ciel sur ses épaules ?",
     ("Atlas", "Prométhée", "Cronos", "Japet"),
     ["mythologie-grecque", "titans"], "Q131983", 0.98, 0.95, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("atlas-heracles-hesperides", "atlas-myth", "titans", "expert",
     "Dans le mythe des pommes d'or, quelle ruse Atlas tente-t-il contre Héraclès ?",
     ("Il lui propose de porter lui-même les pommes pendant qu'Héraclès tient le ciel", "Il lui offre une potion d'oubli", "Il le fait tomber dans un piège", "Il lui donne des pommes empoisonnées"),
     ["mythologie-grecque", "titans"], "Q131983", 0.95, 0.90, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("pandora-opens-jar", "pandora-myth", "titans", "medium",
     "Qu'a ouvert Pandore, la première femme selon le mythe ?",
     ("Une jarre contenant tous les maux", "Un coffre rempli d'or", "Une boîte de musique enchantée", "Un tonneau de vin"),
     ["mythologie-grecque", "titans"], "Q14522", 0.97, 0.93, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("pandora-elpis-remains", "pandora-myth", "titans", "hard",
     "Selon le mythe, qu'est-ce qui reste au fond de la jarre de Pandore ?",
     ("L'Espérance", "La Sagesse", "L'Amour", "La Fortune"),
     ["mythologie-grecque", "titans"], "Q14522", 0.97, 0.93, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("gaia-goddess-of-earth", "gaia-identity", "titans", "easy",
     "Gaïa est la déesse de quoi ?",
     ("De la Terre", "De la Lune", "De la mer", "De la guerre"),
     ["mythologie-grecque", "titans"], "Q8422", 0.98, 0.95, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("ouranos-god-of-sky", "ouranos-identity", "titans", "medium",
     "Ouranos est la personnification de quoi ?",
     ("Du Ciel", "De la Terre", "Des Enfers", "De la mer"),
     ["mythologie-grecque", "titans"], "Q105715", 0.97, 0.94, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("cronos-vs-chronos", "cronos-chronos", "titans", "expert",
     "Quel dieu est souvent confondu avec Cronos bien qu'il personnifie le temps ?",
     ("Chronos", "Kairos", "Aion", "Horus"),
     ["mythologie-grecque", "titans"], "Q159367", 0.95, 0.90, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("cyclopes-children-of-ouranos", "cyclopes-genealogy", "titans", "hard",
     "Quelles créatures borgnes Ouranos et Gaïa ont-elles engendrées ?",
     ("Les Cyclopes", "Les Centaures", "Les Gorgones", "Les Harpies"),
     ["mythologie-grecque", "titans"], "Q128740", 0.96, 0.92, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("mnemosyne-mother-of-muses", "titans-genealogy", "titans", "expert",
     "Quelle Titanide est la mère des neuf Muses ?",
     ("Mnémosyne", "Thémis", "Téthys", "Phoébé"),
     ["mythologie-grecque", "titans"], "Q105976", 0.95, 0.90, CAT, "mythologie-grecque/grecque-titans-001.json"),

    ("iapetus-father-of-prometheus", "titans-genealogy", "titans", "expert",
     "Quel Titan est le père de Prométhée ?",
     ("Japet", "Océan", "Hypérion", "Crios"),
     ["mythologie-grecque", "titans"], "Q50613", 0.96, 0.91, CAT, "mythologie-grecque/grecque-titans-001.json"),

    # ---------------- SYMBOLES ET ATTRIBUTS (13) ----------------
    ("symbol-lightning-zeus", "zeus-attributes", "symboles", "easy",
     "Quel dieu est représenté avec la foudre ?",
     ("Zeus", "Poséidon", "Hadès", "Apollon"),
     ["mythologie-grecque", "symboles"], "Q34201", 0.98, 0.95, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-trident-poseidon", "poseidon-attributes", "symboles", "easy",
     "Quel dieu tient un trident ?",
     ("Poséidon", "Zeus", "Hermès", "Arès"),
     ["mythologie-grecque", "symboles"], "Q41127", 0.98, 0.95, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-caduceus-hermes", "hermes-attributes", "symboles", "medium",
     "Le caducée, bâton entouré de deux serpents, est l'attribut de quel dieu ?",
     ("Hermès", "Asclépios", "Apollon", "Dionysos"),
     ["mythologie-grecque", "symboles"], "Q41492", 0.96, 0.92, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-owl-athena", "athena-attributes", "symboles", "easy",
     "La chouette est le symbole de quelle déesse ?",
     ("Athéna", "Héra", "Artémis", "Aphrodite"),
     ["mythologie-grecque", "symboles"], "Q37122", 0.98, 0.95, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-peacock-hera", "hera-attributes", "symboles", "hard",
     "Le paon est l'attribut de quelle déesse ?",
     ("Héra", "Athéna", "Déméter", "Hestia"),
     ["mythologie-grecque", "symboles"], "Q47602", 0.97, 0.93, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-lyre-apollo", "apollo-attributes", "symboles", "medium",
     "La lyre est l'attribut de quel dieu ?",
     ("Apollon", "Hermès", "Dionysos", "Arès"),
     ["mythologie-grecque", "symboles"], "Q37340", 0.98, 0.95, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-aegis-zeus-athena", "aegis-attribute", "symboles", "hard",
     "L'égide, bouclier ou cuirasse magique, appartient à quels dieux ?",
     ("Zeus et Athéna", "Poséidon et Amphitrite", "Apollon et Artémis", "Arès et Aphrodite"),
     ["mythologie-grecque", "symboles"], "Q34201", 0.96, 0.92, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-dove-aphrodite", "aphrodite-attributes", "symboles", "medium",
     "La colombe est l'attribut de quelle déesse ?",
     ("Aphrodite", "Athéna", "Artémis", "Héra"),
     ["mythologie-grecque", "symboles"], "Q35500", 0.97, 0.94, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-grapes-dionysus", "dionysus-attributes", "symboles", "easy",
     "La grappe de raisin est l'attribut de quel dieu ?",
     ("Dionysos", "Apollon", "Hermès", "Héphaïstos"),
     ["mythologie-grecque", "symboles"], "Q44212", 0.98, 0.95, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-wheat-demeter", "demeter-attributes", "symboles", "medium",
     "La gerbe de blé est l'attribut de quelle déesse ?",
     ("Déméter", "Héra", "Athéna", "Aphrodite"),
     ["mythologie-grecque", "symboles"], "Q40714", 0.97, 0.94, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-winged-sandals-hermes", "hermes-attributes", "symboles", "easy",
     "Quel dieu porte des sandales ailées ?",
     ("Hermès", "Apollon", "Arès", "Poséidon"),
     ["mythologie-grecque", "symboles"], "Q41492", 0.98, 0.95, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-laurel-apollo", "apollo-attributes", "symboles", "hard",
     "Quel arbre, symbole de victoire, est consacré à Apollon ?",
     ("Le laurier", "Le chêne", "L'olivier", "Le cyprès"),
     ["mythologie-grecque", "symboles"], "Q37340", 0.97, 0.93, CAT, "mythologie-grecque/grecque-symboles-001.json"),

    ("symbol-silver-bow-artemis", "artemis-attributes", "symboles", "medium",
     "L'arc et les flèches d'argent sont les attributs de quelle déesse ?",
     ("Artémis", "Athéna", "Aphrodite", "Héra"),
     ["mythologie-grecque", "symboles"], "Q39503", 0.97, 0.94, CAT, "mythologie-grecque/grecque-symboles-001.json"),
]
