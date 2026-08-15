# -*- coding: utf-8 -*-
"""Questions MYTHOLOGIE ÉGYPTIENNE — mort et au-delà, rites funéraires, pharaons, temples."""
CAT = "mythologie-egyptienne"

QUESTIONS = [
    # ---------------- MORT ET AU-DELÀ / RITES FUNÉRAIRES (15) ----------------
    ("book-of-the-dead", "funerary-texts", "mort-au-dela", "medium",
     "Quel recueil de formules accompagne les défunts dans l'au-delà ?",
     ("Le Livre des Morts", "Le Livre des Pyramides", "Le Papyrus d'Ani", "La Pierre de Rosette"),
     ["mythologie-egyptienne", "au-dela"], "Q399088", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("weighing-of-the-heart", "judgment-of-the-dead", "mort-au-dela", "easy",
     "Contre quoi le cœur du défunt est-il pesé lors du jugement ?",
     ("La plume de Maât", "Un scarabée d'or", "Un vase canope", "Le Livre des Morts"),
     ["mythologie-egyptienne", "au-dela"], "Q187377", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("anubis-conducts-the-weighing", "judgment-of-the-dead", "mort-au-dela", "medium",
     "Quel dieu procède à la pesée du cœur ?",
     ("Anubis", "Thot", "Osiris", "Horus"),
     ["mythologie-egyptienne", "au-dela"], "Q146585", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("ammit-the-devourer", "judgment-of-the-dead", "mort-au-dela", "hard",
     "Qu'arrive-t-il au défunt dont le cœur est plus lourd que la plume ?",
     ("Il est dévoré par la créature Ammit", "Il est jeté dans le Noun", "Il est changé en statue", "Il recommence sa vie"),
     ["mythologie-egyptienne", "au-dela"], "Q187377", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("forty-two-assessors", "judgment-of-the-dead", "mort-au-dela", "expert",
     "Combien de juges assesseurs assistent Osiris au tribunal des morts ?",
     ("Quarante-deux", "Douze", "Trente", "Sept"),
     ["mythologie-egyptienne", "au-dela"], "Q47699", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("fields-of-ialu", "afterlife-places", "mort-au-dela", "hard",
     "Comment s'appelle le paradis égyptien où les justes cultivent des champs ?",
     ("Les champs d'Ialou", "Le jardin d'Éden", "L'Élysée", "Le mont Bénou"),
     ["mythologie-egyptienne", "au-dela"], "Q47699", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("ka-the-vital-force", "soul-concepts", "mort-au-dela", "hard",
     "Comment s'appelle la force vitale qui survit après la mort ?",
     ("Le ka", "Le ba", "L'akh", "Le ren"),
     ["mythologie-egyptienne", "au-dela"], "Q47699", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("ba-the-bird-soul", "soul-concepts", "mort-au-dela", "expert",
     "Sous quelle forme le ba, l'âme du défunt, est-il représenté ?",
     ("Un oiseau à tête humaine", "Un faucon", "Un serpent ailé", "Un chat"),
     ["mythologie-egyptienne", "au-dela"], "Q47699", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("duat-the-underworld", "afterlife-places", "mort-au-dela", "medium",
     "Comment s'appelle le monde souterrain que traverse Râ chaque nuit ?",
     ("La Douat", "L'Ialou", "Le Noun", "L'Akhét"),
     ["mythologie-egyptienne", "au-dela"], "Q6587", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("mummification-seventy-days", "mummification", "mort-au-dela", "hard",
     "Combien de jours dure environ le processus de momification ?",
     ("Soixante-dix jours", "Dix jours", "Cent jours", "Trente jours"),
     ["mythologie-egyptienne", "au-dela"], "Q146585", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("canopic-jars-organs", "mummification", "mort-au-dela", "medium",
     "Que contiennent les vases canopes placés auprès de la momie ?",
     ("Les organes prélevés du défunt", "Des bijoux en or", "Des offrandes de nourriture", "Les papyrus sacrés"),
     ["mythologie-egyptienne", "au-dela"], "Q146585", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("four-sons-of-horus-guardians", "mummification", "mort-au-dela", "hard",
     "Qui protège les vases canopes ?",
     ("Les quatre fils d'Horus", "Les quatre vents", "Les quatre saisons", "Les quatre points cardinaux"),
     ["mythologie-egyptienne", "au-dela"], "Q146733", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("ushabti-funerary-figurines", "funerary-equipment", "mort-au-dela", "hard",
     "À quoi servent les ouchebtis placés dans les tombes ?",
     ("À remplacer le défunt dans les travaux des champs de l'au-delà", "À garder la tombe", "À nourrir le défunt", "À éclairer le chemin vers l'au-delà"),
     ["mythologie-egyptienne", "au-dela"], "Q47699", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("heart-scarab", "funerary-equipment", "mort-au-dela", "expert",
     "Quel objet était placé sur le cœur de la momie pour l'empêcher de témoigner contre le défunt ?",
     ("Le scarabée du cœur", "L'œil oudjat", "L'ankh", "Le pilier djed"),
     ["mythologie-egyptienne", "au-dela"], "Q47699", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    ("hall-of-two-truths", "judgment-of-the-dead", "mort-au-dela", "hard",
     "Dans quelle salle se déroule le jugement du défunt ?",
     ("La salle des Deux Vérités", "La salle des Colonnes", "La chambre du Roi", "Le vestibule d'Osiris"),
     ["mythologie-egyptienne", "au-dela"], "Q47699", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-mort-au-dela-001.json"),

    # ---------------- PHARAONS (16) ----------------
    ("khufu-great-pyramid", "pyramid-builders", "pharaons", "easy",
     "Quel pharaon a fait construire la Grande Pyramide de Gizeh ?",
     ("Khéops", "Khéphren", "Mykérinos", "Djéser"),
     ["mythologie-egyptienne", "pharaons"], "Q161904", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("great-pyramid-last-standing-wonder", "pyramid-builders", "pharaons", "medium",
     "Quelle particularité la Grande Pyramide a-t-elle parmi les Sept Merveilles du monde antique ?",
     ("Elle est la seule encore debout", "Elle est la plus petite", "Elle est la seule en pierre", "Elle est la seule bâtie par des esclaves"),
     ["mythologie-egyptienne", "pharaons"], "Q37228", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("khafre-great-sphinx", "pyramid-builders", "pharaons", "hard",
     "Selon l'opinion la plus répandue, quel pharaon fait édifier le grand Sphinx de Gizeh ?",
     ("Khéphren", "Khéops", "Mykérinos", "Ramsès II"),
     ["mythologie-egyptienne", "pharaons"], "Q130962", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("tutankhamun-tomb-discovered-1922", "tutankhamun", "pharaons", "medium",
     "Qui découvre la tombe de Toutânkhamon en 1922 ?",
     ("Howard Carter", "Champollion", "Belzoni", "Mariette"),
     ["mythologie-egyptienne", "pharaons"], "Q142546", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("tutankhamun-child-king", "tutankhamun", "pharaons", "easy",
     "Pourquoi appelle-t-on Toutânkhamon le « pharaon enfant » ?",
     ("Il est monté sur le trône très jeune", "Il était de petite taille", "Il était le plus jeune fils de Ramsès II", "Il a régné uniquement pendant son enfance"),
     ["mythologie-egyptienne", "pharaons"], "Q142546", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("ramses-ii-abu-simbel", "ramses-ii", "pharaons", "medium",
     "Quel pharaon a fait tailler les temples d'Abou Simbel ?",
     ("Ramsès II", "Toutânkhamon", "Akhenaton", "Thoutmôsis III"),
     ["mythologie-egyptienne", "pharaons"], "Q161901", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("ramses-ii-battle-of-qadesh", "ramses-ii", "pharaons", "hard",
     "Contre quel peuple Ramsès II mène-t-il la bataille de Qadesh ?",
     ("Les Hittites", "Les Assyriens", "Les Perses", "Les Nubiens"),
     ["mythologie-egyptienne", "pharaons"], "Q161901", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("cleopatra-last-queen-of-egypt", "cleopatra", "pharaons", "medium",
     "Qui est la dernière souveraine de l'Égypte ptolémaïque ?",
     ("Cléopâtre VII", "Néfertiti", "Hatshepsout", "Arsinoé"),
     ["mythologie-egyptienne", "pharaons"], "Q6351", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("cleopatra-alliances-caesar-antony", "cleopatra", "pharaons", "hard",
     "Quels Romains Cléopâtre VII s'allie-t-elle successivement ?",
     ("Jules César puis Marc Antoine", "Auguste puis Tibère", "Pompée puis Brutus", "Néron puis Caligula"),
     ["mythologie-egyptienne", "pharaons"], "Q6351", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("akhenaten-cult-of-aton", "akhenaten", "pharaons", "medium",
     "Quel pharaon instaure le culte exclusif du disque solaire Aton ?",
     ("Akhenaton", "Ramsès II", "Khéops", "Sésostris"),
     ["mythologie-egyptienne", "pharaons"], "Q81736", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("nefertiti-wife-of-akhenaten", "akhenaten-family", "pharaons", "medium",
     "Qui est Néfertiti ?",
     ("L'épouse d'Akhenaton", "La fille de Ramsès II", "La sœur de Cléopâtre", "La mère de Toutânkhamon"),
     ["mythologie-egyptienne", "pharaons"], "Q131302", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("hatshepsut-female-pharaoh", "hatshepsut", "pharaons", "medium",
     "Quelle particularité Hatshepsout présente-t-elle ?",
     ("Elle est une femme devenue pharaon", "Elle est la plus jeune pharaon", "Elle est la seule pharaon aveugle", "Elle est la première pharaon nubienne"),
     ["mythologie-egyptienne", "pharaons"], "Q107334", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("imhotep-step-pyramid-architect", "imhotep-djoser", "pharaons", "hard",
     "Quel architecte a conçu la pyramide à degrés de Djéser ?",
     ("Imhotep", "Sénènmout", "Hémon", "Inéni"),
     ["mythologie-egyptienne", "pharaons"], "Q131169", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("djoser-first-step-pyramid", "imhotep-djoser", "pharaons", "medium",
     "Quelle est la première pyramide construite en Égypte ?",
     ("La pyramide à degrés de Djéser à Saqqarah", "La Grande Pyramide", "La pyramide rhomboïdale", "La pyramide de Meïdoum"),
     ["mythologie-egyptienne", "pharaons"], "Q131169", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("pharaoh-son-of-ra", "pharaoh-ideology", "pharaons", "easy",
     "Quel titre divin le pharaon porte-t-il ?",
     ("Fils de Râ", "Frère d'Osiris", "Serviteur de Seth", "Prêtre d'Isis"),
     ["mythologie-egyptienne", "pharaons"], "Q161240", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    ("cartouche-royal-name", "pharaoh-symbols", "pharaons", "medium",
     "Comment s'appelle l'anneau ovale qui encadre le nom du pharaon ?",
     ("Le cartouche", "L'ankh", "L'uræus", "Le pschent"),
     ["mythologie-egyptienne", "pharaons"], "Q161240", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-pharaons-001.json"),

    # ---------------- TEMPLES (8) ----------------
    ("karnak-largest-temple-complex", "temple-sites", "temples", "easy",
     "Quel est le plus grand complexe religieux de l'Égypte ancienne ?",
     ("Karnak", "Abou Simbel", "Philae", "Edfou"),
     ["mythologie-egyptienne", "temples"], "Q183246", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-temples-001.json"),

    ("luxor-temple-of-amun", "temple-sites", "temples", "medium",
     "Quel temple, relié à Karnak par une allée de sphinx, est dédié à Amon ?",
     ("Louxor", "Dendérah", "Esna", "Kom Ombo"),
     ["mythologie-egyptienne", "temples"], "Q101851", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-temples-001.json"),

    ("abu-simbel-four-colossi", "temple-sites", "temples", "medium",
     "Combien de colosses de Ramsès II ornent la façade du grand temple d'Abou Simbel ?",
     ("Quatre", "Deux", "Six", "Huit"),
     ["mythologie-egyptienne", "temples"], "Q177733", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-temples-001.json"),

    ("philae-temple-of-isis", "temple-sites", "temples", "hard",
     "Sur quelle île se dresse le grand temple d'Isis ?",
     ("Philae", "Éléphantine", "Roda", "Sehel"),
     ["mythologie-egyptienne", "temples"], "Q41488", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-temples-001.json"),

    ("edfu-best-preserved-temple", "temple-sites", "temples", "hard",
     "Quel temple, dédié à Horus, est le mieux conservé d'Égypte ?",
     ("Edfou", "Karnak", "Louxor", "Philae"),
     ["mythologie-egyptienne", "temples"], "Q146733", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-temples-001.json"),

    ("dendera-temple-of-hathor", "temple-sites", "temples", "medium",
     "Quelle déesse est vénérée dans le grand temple de Dendérah ?",
     ("Hathor", "Sekhmet", "Bastet", "Maât"),
     ["mythologie-egyptienne", "temples"], "Q134259", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-temples-001.json"),

    ("abydos-sanctuary-of-osiris", "temple-sites", "temples", "hard",
     "Quelle ville abrite le grand sanctuaire d'Osiris ?",
     ("Abydos", "Saqqarah", "Bubastis", "Saïs"),
     ["mythologie-egyptienne", "temples"], "Q47699", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-temples-001.json"),

    ("valley-of-the-kings", "royal-necropolis", "temples", "easy",
     "Où les pharaons du Nouvel Empire sont-ils enterrés ?",
     ("Dans la vallée des Rois", "Dans les pyramides de Gizeh", "Dans le temple de Karnak", "Sous le Sphinx"),
     ["mythologie-egyptienne", "temples"], "Q142546", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-temples-001.json"),
]
