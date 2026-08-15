# -*- coding: utf-8 -*-
"""Questions MYTHOLOGIE GRECQUE — héros, travaux d'Héraclès, Enfers, lieux, créatures, guerre de Troie."""
CAT = "mythologie-grecque"

QUESTIONS = [
    # ---------------- HÉROS (30) ----------------
    ("heracles-son-of-zeus", "heracles-genealogy", "heros", "medium",
     "Qui est le père d'Héraclès ?",
     ("Zeus", "Poséidon", "Apollon", "Arès"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("heracles-mother-alcmene", "heracles-genealogy", "heros", "hard",
     "Qui est la mère mortelle d'Héraclès ?",
     ("Alcmène", "Danaé", "Léda", "Sémélé"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.96, 0.92, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("heracles-known-for-strength", "heracles-identity", "heros", "easy",
     "Pour quelle qualité Héraclès est-il surtout connu ?",
     ("Sa force prodigieuse", "Sa ruse", "Sa vitesse", "Sa sagesse"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("heracles-roman-name-hercules", "heracles-identity", "heros", "easy",
     "Quel est le nom romain d'Héraclès ?",
     ("Hercule", "Achille", "Ulysse", "Persée"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("heracles-strangles-snakes", "heracles-childhood", "heros", "hard",
     "Quel exploit Héraclès accomplit-il dès son berceau ?",
     ("Il étrangle deux serpents", "Il soulève un rocher", "Il dompte un lion", "Il éteint un incendie"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.97, 0.93, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("heracles-iolaus-hydra-helper", "heracles-companions", "heros", "expert",
     "Quel neveu d'Héraclès l'aide à vaincre l'hydre de Lerne ?",
     ("Iolaos", "Thésée", "Patrocle", "Antiloque"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.95, 0.90, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("heracles-death-nessus-tunic", "heracles-death", "heros", "expert",
     "Comment Héraclès trouve-t-il la mort ?",
     ("En revêtant une tunique empoisonnée offerte par sa femme", "Transpercé par une flèche", "Dévoré par le lion de Némée", "Noyé dans la mer"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.95, 0.90, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("perseus-kills-medusa", "perseus-myth", "heros", "easy",
     "Quel héros a tué la gorgone Méduse ?",
     ("Persée", "Thésée", "Jason", "Bellérophon"),
     ["mythologie-grecque", "perseus"], "Q130721", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("perseus-mirror-shield", "perseus-myth", "heros", "medium",
     "Comment Persée évite-t-il le regard pétrifiant de Méduse ?",
     ("En utilisant son bouclier poli comme un miroir", "En fermant les yeux", "En portant un casque d'invisibilité", "En se cachant derrière un rocher"),
     ["mythologie-grecque", "perseus"], "Q130721", 0.97, 0.94, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("perseus-andromeda", "perseus-myth", "heros", "hard",
     "Quelle princesse Persée délivre-t-il d'un monstre marin ?",
     ("Andromède", "Ariane", "Hélène", "Cassandre"),
     ["mythologie-grecque", "perseus"], "Q130721", 0.97, 0.93, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("theseus-kills-minotaur", "theseus-myth", "heros", "easy",
     "Quel héros a tué le Minotaure ?",
     ("Thésée", "Persée", "Héraclès", "Jason"),
     ["mythologie-grecque", "theseus"], "Q128962", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("ariadne-thread-labyrinth", "theseus-myth", "heros", "medium",
     "Qui donne à Thésée le fil qui lui permet de sortir du Labyrinthe ?",
     ("Ariane", "Médée", "Phèdre", "Circé"),
     ["mythologie-grecque", "theseus"], "Q128962", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("aegeus-throws-himself-into-sea", "theseus-myth", "heros", "hard",
     "Pourquoi la mer Égée porte-t-elle ce nom ?",
     ("Parce qu'Égée, croyant son fils mort, s'y est jeté", "Parce qu'Égée y régna", "Parce qu'Égée y fut vaincu", "Parce qu'Égée y construisit sa flotte"),
     ["mythologie-grecque", "theseus"], "Q128962", 0.96, 0.92, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("jason-golden-fleece", "jason-myth", "heros", "easy",
     "Quel héros part à la conquête de la Toison d'or ?",
     ("Jason", "Thésée", "Persée", "Achille"),
     ["mythologie-grecque", "jason"], "Q168712", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("medea-helps-jason", "jason-myth", "heros", "medium",
     "Quelle magicienne aide Jason à conquérir la Toison d'or ?",
     ("Médée", "Circé", "Hécate", "Pasiphaé"),
     ["mythologie-grecque", "jason"], "Q168712", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("argonauts-ship-argo", "jason-myth", "heros", "medium",
     "Comment s'appelle le navire des compagnons de Jason ?",
     ("L'Argo", "Le Pégase", "Le Triton", "L'Égée"),
     ["mythologie-grecque", "jason"], "Q168712", 0.97, 0.94, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("oedipus-sphinx-riddle", "oedipus-myth", "heros", "easy",
     "Quel héros résout l'énigme du Sphinx ?",
     ("Œdipe", "Thésée", "Ulysse", "Bellérophon"),
     ["mythologie-grecque", "oedipe"], "Q133071", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("oedipus-marries-jocaste", "oedipus-myth", "heros", "hard",
     "Qui Œdipe épouse-t-il sans le savoir ?",
     ("Sa mère Jocaste", "Sa sœur Antigone", "Sa tante Europe", "Sa nourrice"),
     ["mythologie-grecque", "oedipe"], "Q133071", 0.97, 0.93, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("orpheus-eurydice", "orpheus-myth", "heros", "easy",
     "Qui Orphée tente-t-il de ramener des Enfers ?",
     ("Eurydice", "Perséphone", "Daphné", "Hélène"),
     ["mythologie-grecque", "orphee"], "Q128438", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("orpheus-turns-around", "orpheus-myth", "heros", "medium",
     "Pourquoi Orphée perd-il définitivement Eurydice ?",
     ("Parce qu'il se retourne pour la regarder avant la sortie des Enfers", "Parce qu'il chante faux", "Parce qu'il refuse de payer Charon", "Parce qu'il la laisse boire l'eau du Léthé"),
     ["mythologie-grecque", "orphee"], "Q128438", 0.97, 0.94, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("bellerophon-kills-chimera", "bellerophon-myth", "heros", "medium",
     "Quel héros, monté sur Pégase, tue la Chimère ?",
     ("Bellérophon", "Persée", "Jason", "Héraclès"),
     ["mythologie-grecque", "heros"], "Q174131", 0.97, 0.93, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("atalante-calydonian-boar", "atalante-myth", "heros", "hard",
     "Quelle héroïne participe à la chasse au sanglier de Calydon ?",
     ("Atalante", "Pénélope", "Cassandre", "Andromaque"),
     ["mythologie-grecque", "heros"], "Q187692", 0.96, 0.92, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("achilles-vulnerable-heel", "achilles-identity", "heros", "easy",
     "Quelle est la seule partie vulnérable du corps d'Achille ?",
     ("Le talon", "Le cou", "Le genou", "L'épaule"),
     ["mythologie-grecque", "achille"], "Q41746", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("achilles-mother-thetis", "achilles-genealogy", "heros", "medium",
     "Qui est la mère d'Achille, déesse marine ?",
     ("Thétis", "Amphitrite", "Héra", "Léto"),
     ["mythologie-grecque", "achille"], "Q41746", 0.97, 0.94, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("achilles-dipped-in-styx", "achilles-genealogy", "heros", "medium",
     "Dans quel fleuve Thétis plonge-t-elle Achille pour le rendre invulnérable ?",
     ("Le Styx", "Le Léthé", "L'Achéron", "Le Cocyte"),
     ["mythologie-grecque", "achille"], "Q41746", 0.97, 0.94, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("daedalus-builds-labyrinth", "daedalus-myth", "heros", "medium",
     "Quel architecte a construit le Labyrinthe de Crète ?",
     ("Dédale", "Icare", "Prométhée", "Trophonios"),
     ["mythologie-grecque", "heros"], "Q130142", 0.97, 0.93, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("icarus-wax-wings", "daedalus-myth", "heros", "easy",
     "Pourquoi Icare tombe-t-il dans la mer ?",
     ("Il s'approche trop du Soleil et ses ailes de cire fondent", "Il s'endort en volant", "Sa corde se rompt", "Il est frappé par la foudre de Zeus"),
     ["mythologie-grecque", "heros"], "Q130142", 0.98, 0.95, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("antigone-buries-polyneices", "antigone-myth", "heros", "expert",
     "Quel acte Antigone commet-elle, selon la pièce de Sophocle ?",
     ("Elle enterre son frère malgré l'interdiction du roi", "Elle trahit Athènes", "Elle vole le feu sacré", "Elle révèle un secret d'État"),
     ["mythologie-grecque", "heros"], "Q7235", 0.97, 0.93, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("cadmus-founder-of-thebes", "cadmus-myth", "heros", "expert",
     "Selon le mythe, qui est le fondateur de la cité de Thèbes ?",
     ("Cadmos", "Danaos", "Pélops", "Érechthée"),
     ["mythologie-grecque", "heros"], "Q133071", 0.95, 0.90, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("theseus-son-of-aegeus", "theseus-genealogy", "heros", "hard",
     "Selon la version la plus courante, qui est le père de Thésée ?",
     ("Égée", "Poséidon", "Pélée", "Éole"),
     ["mythologie-grecque", "theseus"], "Q128962", 0.96, 0.92, CAT, "mythologie-grecque/grecque-heros-001.json"),

    ("theseus-marathonian-bull", "theseus-myth", "heros", "hard",
     "Quel héros athénien a capturé le taureau de Marathon ?",
     ("Thésée", "Héraclès", "Persée", "Jason"),
     ["mythologie-grecque", "theseus"], "Q128962", 0.96, 0.91, CAT, "mythologie-grecque/grecque-heros-001.json"),

    # ---------------- TRAVAUX D'HÉRACLÈS (15) ----------------
    ("heracles-twelve-labors-count", "heracles-labors", "travaux-heracles", "easy",
     "Combien de travaux Héraclès doit-il accomplir ?",
     ("Douze", "Dix", "Sept", "Vingt"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.98, 0.95, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-labors-imposed-by-eurystheus", "heracles-labors", "travaux-heracles", "easy",
     "Quel roi impose les travaux à Héraclès ?",
     ("Eurysthée", "Agamemnon", "Minos", "Créon"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.97, 0.94, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-first-labor-nemean-lion", "heracles-first-labor", "travaux-heracles", "medium",
     "Quel est le premier travail d'Héraclès ?",
     ("Tuer le lion de Némée", "Tuer l'hydre de Lerne", "Capturer le sanglier d'Érymanthe", "Nettoyer les écuries d'Augias"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.98, 0.95, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-strangles-nemean-lion", "heracles-first-labor", "travaux-heracles", "hard",
     "Comment Héraclès tue-t-il le lion de Némée ?",
     ("En l'étranglant à mains nues", "Avec son arc", "Avec son épée", "En le noyant"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.97, 0.93, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-hydra-cauterizes-necks", "heracles-second-labor", "travaux-heracles", "hard",
     "Comment Héraclès empêche-t-il les têtes de l'hydre de Lerne de repousser ?",
     ("En cautérisant les cous avec des tisons", "En les coupant plus vite", "En les gelant", "En les enterrant"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.97, 0.93, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-augian-stables", "heracles-fifth-labor", "travaux-heracles", "medium",
     "Comment Héraclès nettoie-t-il les écuries d'Augias ?",
     ("En détournant deux fleuves", "En les brûlant", "En les vidant à la pelle", "En y lâchant les bœufs de Géryon"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.97, 0.94, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-cerberus-last-labor", "heracles-twelfth-labor", "travaux-heracles", "medium",
     "Quel est le dernier des douze travaux d'Héraclès ?",
     ("Ramener Cerbère des Enfers", "Tuer l'hydre de Lerne", "Cueillir les pommes des Hespérides", "Capturer la biche de Cérynie"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.97, 0.94, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-hesperides-apples-atlas", "heracles-eleventh-labor", "travaux-heracles", "hard",
     "Qui aide Héraclès à cueillir les pommes d'or des Hespérides ?",
     ("Atlas", "Prométhée", "Hermès", "Eurysthée"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.97, 0.93, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-hippolyta-belt", "heracles-ninth-labor", "travaux-heracles", "medium",
     "Quel travail d'Héraclès consiste à s'emparer de la ceinture d'une reine des Amazones ?",
     ("La ceinture d'Hippolyte", "Le diadème de Penthésilée", "Le collier d'Hélène", "Le voile d'Électre"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.97, 0.94, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-stymphalian-birds", "heracles-sixth-labor", "travaux-heracles", "hard",
     "Quels oiseaux aux plumes de bronze Héraclès doit-il chasser ?",
     ("Les oiseaux du lac Stymphale", "Les harpies du Strymon", "Les corbeaux du Parnasse", "Les vautours du Caucase"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.96, 0.92, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-erymanthian-boar", "heracles-fourth-labor", "travaux-heracles", "hard",
     "Que doit faire Héraclès du sanglier d'Érymanthe ?",
     ("Le ramener vivant", "Le tuer d'une flèche", "Le noyer", "Le dévorer"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.96, 0.92, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-cerynitian-hind", "heracles-third-labor", "travaux-heracles", "expert",
     "Quelle particularité a la biche de Cérynie, troisième travail d'Héraclès ?",
     ("Ses cornes sont en or", "Son pelage est bleu", "Elle est géante", "Elle crache du feu"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.96, 0.91, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-cretan-bull", "heracles-seventh-labor", "travaux-heracles", "expert",
     "Quel animal Héraclès doit-il capturer en Crète ?",
     ("Le taureau de Minos", "Le cheval Pégase", "Le chien Orthos", "La chèvre Amalthée"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.96, 0.91, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-diomedes-mares", "heracles-eighth-labor", "travaux-heracles", "expert",
     "Quelle est la particularité des juments de Diomède ?",
     ("Elles sont carnivores", "Elles ont des ailes", "Elles sont invisibles", "Elles crachent du feu"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.95, 0.90, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    ("heracles-gerion-cattle", "heracles-tenth-labor", "travaux-heracles", "expert",
     "Quel géant à trois corps garde des bœufs qu'Héraclès doit voler ?",
     ("Géryon", "Antée", "Alcyonée", "Typhon"),
     ["mythologie-grecque", "heracles"], "Q122319", 0.96, 0.91, CAT, "mythologie-grecque/grecque-travaux-heracles-001.json"),

    # ---------------- ENFERS (12) ----------------
    ("charon-ferryman-of-the-dead", "underworld-charon", "enfers", "easy",
     "Qui fait traverser le fleuve des Enfers aux âmes des morts ?",
     ("Charon", "Cerbère", "Thanatos", "Hermès"),
     ["mythologie-grecque", "enfers"], "Q83499", 0.98, 0.95, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("charon-obol-payment", "underworld-charon", "enfers", "hard",
     "Que glisse-t-on sous la langue des morts pour payer Charon ?",
     ("Une obole", "Un drachme", "Une perle", "Une pièce d'or"),
     ["mythologie-grecque", "enfers"], "Q83499", 0.97, 0.93, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("styx-river-of-the-underworld", "underworld-rivers", "enfers", "medium",
     "Quel est le nom du fleuve principal des Enfers, dont les eaux rendent invulnérable ?",
     ("Le Styx", "Le Nil", "L'Eurotas", "Le Pactole"),
     ["mythologie-grecque", "enfers"], "Q162884", 0.97, 0.94, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("lethe-river-of-forgetting", "underworld-rivers", "enfers", "hard",
     "Quel fleuve des Enfers est le fleuve de l'oubli ?",
     ("Le Léthé", "Le Styx", "L'Achéron", "Le Phlégéthon"),
     ["mythologie-grecque", "enfers"], "Q162884", 0.96, 0.92, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("minos-rhadamanthus-judges", "underworld-judges", "enfers", "hard",
     "Qui juge les âmes des morts aux Enfers ?",
     ("Minos et Rhadamanthe", "Zeus et Apollon", "Héraclès et Thésée", "Éaque et Tantale"),
     ["mythologie-grecque", "enfers"], "Q41410", 0.97, 0.93, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("sisyphus-rolls-boulder", "underworld-punishments", "enfers", "easy",
     "Quel personnage est condamné à pousser éternellement un rocher ?",
     ("Sisyphe", "Tantale", "Ixion", "Prométhée"),
     ["mythologie-grecque", "enfers"], "Q124285", 0.98, 0.95, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("tantalus-eternal-hunger", "underworld-punishments", "enfers", "medium",
     "Quel est le supplice de Tantale ?",
     ("Une faim et une soif éternelles au milieu de fruits et d'eau qui se dérobent", "Pousser un rocher", "Être dévoré par un aigle", "Tourner une roue enflammée"),
     ["mythologie-grecque", "enfers"], "Q202187", 0.97, 0.94, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("danaides-perforated-barrel", "underworld-punishments", "enfers", "expert",
     "Quel est le châtiment des Danaïdes ?",
     ("Remplir un tonneau percé", "Pousser un rocher", "Porter l'eau du Styx", "S'asseoir sur un trône brûlant"),
     ["mythologie-grecque", "enfers"], "Q41410", 0.96, 0.91, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("elysian-fields-blessed", "underworld-places", "enfers", "medium",
     "Où séjournent les héros et les bienheureux après leur mort ?",
     ("Aux Champs Élysées", "Au Tartare", "Dans les Champs des Asphodèles", "Au jardin des Hespérides"),
     ["mythologie-grecque", "enfers"], "Q41410", 0.97, 0.94, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("tartarus-deepest-abyss", "underworld-places", "enfers", "hard",
     "Quel est le nom de l'abîme le plus profond des Enfers, prison des Titans ?",
     ("Le Tartare", "Le Léthé", "L'Érèbe", "Le Styx"),
     ["mythologie-grecque", "enfers"], "Q41410", 0.97, 0.93, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("erinyes-vengeance-goddesses", "underworld-deities", "enfers", "hard",
     "Quelles déesses personnifient la vengeance et poursuivent les criminels ?",
     ("Les Érinyes", "Les Grâces", "Les Moires", "Les Muses"),
     ["mythologie-grecque", "enfers"], "Q41410", 0.96, 0.92, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    ("asphodel-meadows-ordinary-souls", "underworld-places", "enfers", "expert",
     "Où errent les âmes des mortels ordinaires selon les mythes grecs ?",
     ("Dans les Champs des Asphodèles", "Aux Champs Élysées", "Au Tartare", "Sur les rives du Léthé"),
     ["mythologie-grecque", "enfers"], "Q41410", 0.95, 0.90, CAT, "mythologie-grecque/grecque-enfers-001.json"),

    # ---------------- LIEUX (13) ----------------
    ("mount-olympus-location", "greek-geography", "lieux", "medium",
     "Où se trouve le mont Olympe, demeure des dieux ?",
     ("En Grèce, à la frontière entre la Thessalie et la Macédoine", "En Crète", "Dans le Péloponnèse", "Sur l'île de Délos"),
     ["mythologie-grecque", "lieux"], "Q131148", 0.96, 0.92, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("delphi-oracle-of-apollo", "delphi", "lieux", "easy",
     "Quel sanctuaire abrite le célèbre oracle d'Apollon ?",
     ("Delphes", "Olympie", "Épidaure", "Délos"),
     ["mythologie-grecque", "lieux"], "Q37340", 0.98, 0.95, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("pythia-prophetess-of-delphi", "delphi", "lieux", "medium",
     "Comment s'appelle la prêtresse qui rend les oracles à Delphes ?",
     ("La Pythie", "La Sibylle", "La Ménade", "La Vestale"),
     ["mythologie-grecque", "lieux"], "Q37340", 0.97, 0.94, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("mount-parnassus-home-of-muses", "greek-geography", "lieux", "medium",
     "Quelle montagne est le séjour des Muses ?",
     ("Le Parnasse", "L'Olympe", "L'Ida", "L'Etna"),
     ["mythologie-grecque", "lieux"], "Q66063", 0.96, 0.92, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("atlantis-island-of-plato", "legendary-places", "lieux", "medium",
     "Quel philosophe grec raconte le mythe de l'Atlantide ?",
     ("Platon", "Aristote", "Homère", "Hérodote"),
     ["mythologie-grecque", "lieux"], "Q859", 0.98, 0.95, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("labyrinth-of-cnossos", "legendary-places", "lieux", "hard",
     "Où se trouve le Labyrinthe du Minotaure ?",
     ("En Crète, à Cnossos", "À Athènes", "À Thèbes", "À Mycènes"),
     ["mythologie-grecque", "lieux"], "Q42998", 0.97, 0.93, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("colchis-golden-fleece", "legendary-places", "lieux", "hard",
     "Dans quel pays lointain se trouve la Toison d'or ?",
     ("En Colchide", "En Égypte", "En Inde", "En Scythie"),
     ["mythologie-grecque", "lieux"], "Q168712", 0.97, 0.93, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("ithaca-kingdom-of-odysseus", "greek-geography", "lieux", "medium",
     "Quelle île est le royaume d'Ulysse ?",
     ("Ithaque", "Chypre", "Lesbos", "Samos"),
     ["mythologie-grecque", "lieux"], "Q47220", 0.98, 0.95, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("mount-ida-judgment-of-paris", "greek-geography", "lieux", "hard",
     "Sur quel mont se déroule le jugement de Pâris ?",
     ("Le mont Ida", "Le mont Olympe", "Le Parnasse", "Le Cithéron"),
     ["mythologie-grecque", "lieux"], "Q130543", 0.96, 0.92, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("mycenae-city-of-agamemnon", "greek-geography", "lieux", "medium",
     "Quelle cité est gouvernée par Agamemnon ?",
     ("Mycènes", "Sparte", "Athènes", "Argos"),
     ["mythologie-grecque", "lieux"], "Q128176", 0.97, 0.94, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("sparta-city-of-menelaus", "greek-geography", "lieux", "hard",
     "Quel roi règne sur Sparte aux côtés d'Hélène ?",
     ("Ménélas", "Agamemnon", "Priam", "Nestor"),
     ["mythologie-grecque", "lieux"], "Q165988", 0.96, 0.92, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("thebes-city-of-oedipus", "greek-geography", "lieux", "medium",
     "De quelle cité Œdipe devient-il le roi ?",
     ("Thèbes", "Athènes", "Corinthe", "Argos"),
     ["mythologie-grecque", "lieux"], "Q133071", 0.98, 0.95, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    ("aegean-sea-named-after-aegeus", "greek-geography", "lieux", "hard",
     "La mer Égée doit son nom à quel roi légendaire ?",
     ("Égée", "Minos", "Éole", "Nérée"),
     ["mythologie-grecque", "lieux"], "Q128962", 0.96, 0.92, CAT, "mythologie-grecque/grecque-lieux-001.json"),

    # ---------------- CRÉATURES (20) ----------------
    ("medusa-petrifying-glance", "gorgons", "creatures", "easy",
     "Quel est le pouvoir de Méduse ?",
     ("Pétrifier ceux qui croisent son regard", "Endormir ceux qui l'écoutent", "Voler la force des hommes", "Changer l'eau en pierre"),
     ["mythologie-grecque", "creatures"], "Q160730", 0.98, 0.95, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("medusa-only-mortal-gorgon", "gorgons", "creatures", "hard",
     "Quelle particularité distingue Méduse de ses deux sœurs ?",
     ("Elle est la seule mortelle", "Elle est la seule aveugle", "Elle est la seule à avoir des ailes", "Elle est la seule à être immortelle"),
     ["mythologie-grecque", "creatures"], "Q160730", 0.97, 0.93, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("minotaur-half-man-half-bull", "minotaur", "creatures", "easy",
     "Quelle est l'apparence du Minotaure ?",
     ("Un homme à tête de taureau", "Un taureau à tête d'homme", "Un homme à corps de cheval", "Un géant à trois têtes"),
     ["mythologie-grecque", "creatures"], "Q42998", 0.98, 0.95, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("minotaur-son-of-pasiphae", "minotaur", "creatures", "medium",
     "Qui est la mère du Minotaure ?",
     ("Pasiphaé", "Ariane", "Méduse", "Circé"),
     ["mythologie-grecque", "creatures"], "Q42998", 0.96, 0.92, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("cerberus-three-headed-dog", "cerberus", "creatures", "easy",
     "Quel chien à trois têtes garde l'entrée des Enfers ?",
     ("Cerbère", "Orthos", "Argos", "Sphinx"),
     ["mythologie-grecque", "creatures"], "Q83217", 0.98, 0.95, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("cerberus-snake-tail", "cerberus", "creatures", "hard",
     "Quelle particularité possède la queue de Cerbère ?",
     ("Elle se termine par une tête de serpent", "Elle est en bronze", "Elle crache du feu", "Elle est couverte de plumes"),
     ["mythologie-grecque", "creatures"], "Q83217", 0.96, 0.92, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("chimera-fire-breathing-monster", "chimera", "creatures", "medium",
     "Quelle créature crache du feu et mêle le lion, la chèvre et le serpent ?",
     ("La Chimère", "L'Hydre", "Le Sphinx", "La Gorgone"),
     ["mythologie-grecque", "creatures"], "Q170403", 0.97, 0.94, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("pegasus-winged-horse", "pegasus", "creatures", "easy",
     "Quel est le célèbre cheval ailé de la mythologie grecque ?",
     ("Pégase", "Arion", "Xanthe", "Balios"),
     ["mythologie-grecque", "creatures"], "Q163901", 0.97, 0.94, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("sphinx-riddles-travellers", "sphinx", "creatures", "medium",
     "Quelle créature pose une énigme aux voyageurs près de Thèbes ?",
     ("Le Sphinx", "La Harpie", "La Sirène", "La Chimère"),
     ["mythologie-grecque", "creatures"], "Q133071", 0.97, 0.94, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("centaurs-half-horse", "centaurs", "creatures", "easy",
     "Quelle est l'apparence des Centaures ?",
     ("Mi-homme, mi-cheval", "Mi-homme, mi-bouc", "Mi-homme, mi-taureau", "Mi-homme, mi-poisson"),
     ["mythologie-grecque", "creatures"], "Q183600", 0.98, 0.95, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("chiron-wise-centaur-tutor", "centaurs", "creatures", "hard",
     "Quel centaure, réputé sage et savant, éduque Achille ?",
     ("Chiron", "Nessos", "Pholos", "Eurysthée"),
     ["mythologie-grecque", "creatures"], "Q183600", 0.97, 0.93, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("sirens-enchanting-song", "sirens", "creatures", "medium",
     "Quel danger représentent les Sirènes pour les marins ?",
     ("Leur chant ensorcelle et fait échouer les navires", "Leurs griffes déchirent les voiles", "Leur regard pétrifie", "Elles créent des tempêtes"),
     ["mythologie-grecque", "creatures"], "Q170960", 0.97, 0.94, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("hydra-regrowing-heads", "hydra", "creatures", "medium",
     "Quelle créature des marais de Lerne possède plusieurs têtes qui repoussent ?",
     ("L'Hydre", "La Chimère", "Le dragon de Colchide", "L'Échidna"),
     ["mythologie-grecque", "creatures"], "Q170385", 0.97, 0.94, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("nemean-lion-invulnerable-hide", "nemean-lion", "creatures", "medium",
     "Pourquoi les flèches sont-elles inefficaces contre le lion de Némée ?",
     ("Sa peau est invulnérable", "Il est invisible", "Il est immortel", "Il est protégé par Arès"),
     ["mythologie-grecque", "creatures"], "Q122319", 0.97, 0.94, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("harpies-snatching-creatures", "harpies", "creatures", "hard",
     "Quelles créatures ailées au visage de femme volent les nourritures et les personnes ?",
     ("Les Harpies", "Les Sirènes", "Les Nymphes", "Les Grâces"),
     ["mythologie-grecque", "creatures"], "Q190508", 0.96, 0.92, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("odysseus-blinds-polyphemus", "cyclops", "creatures", "medium",
     "Quel Cyclope Ulysse aveugle-t-il ?",
     ("Polyphème", "Brontès", "Stéropès", "Argès"),
     ["mythologie-grecque", "creatures"], "Q47220", 0.98, 0.95, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("odysseus-escapes-under-sheep", "cyclops", "creatures", "hard",
     "Comment Ulysse et ses hommes échappent-ils à Polyphème ?",
     ("En se cachant sous les moutons du Cyclope", "En creusant un tunnel", "En l'endormant avec un chant", "En le tuant dans son sommeil"),
     ["mythologie-grecque", "creatures"], "Q47220", 0.97, 0.93, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("satyrs-companions-of-dionysus", "satyrs", "creatures", "medium",
     "Quelles créatures mi-hommes mi-boucs accompagnent Dionysos ?",
     ("Les Satyres", "Les Centaures", "Les Tritons", "Les Faunes"),
     ["mythologie-grecque", "creatures"], "Q44212", 0.96, 0.92, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("nymphs-nature-spirits", "nymphs", "creatures", "easy",
     "Comment appelle-t-on les divinités féminines de la nature dans la mythologie grecque ?",
     ("Les Nymphes", "Les Muses", "Les Grâces", "Les Hespérides"),
     ["mythologie-grecque", "creatures"], "Q130333", 0.98, 0.95, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    ("typhon-giant-monster", "typhon", "creatures", "hard",
     "Quel monstre géant, parfois décrit avec cent têtes de serpent, défie Zeus ?",
     ("Typhon", "Géryon", "Antée", "Briarée"),
     ["mythologie-grecque", "creatures"], "Q34201", 0.96, 0.92, CAT, "mythologie-grecque/grecque-creatures-001.json"),

    # ---------------- GUERRE DE TROIE, ILIADE, ODYSSÉE (26) ----------------
    ("trojan-war-cause-helen", "trojan-war-causes", "guerre-de-troie", "easy",
     "Quel événement déclenche la guerre de Troie ?",
     ("L'enlèvement d'Hélène par Pâris", "Le vol de la Toison d'or", "La mort de Patrocle", "Le rapt de Perséphone"),
     ["mythologie-grecque", "troie"], "Q207360", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("helen-wife-of-menelaus", "trojan-war-causes", "guerre-de-troie", "medium",
     "Qui est l'époux légitime d'Hélène avant son enlèvement ?",
     ("Ménélas", "Agamemnon", "Pâris", "Achille"),
     ["mythologie-grecque", "troie"], "Q131596", 0.97, 0.94, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("judgment-of-paris-apple", "trojan-war-causes", "guerre-de-troie", "hard",
     "Quelle déesse Pâris désigne-t-il comme la plus belle, s'attirant la haine des deux autres ?",
     ("Aphrodite", "Héra", "Athéna", "Artémis"),
     ["mythologie-grecque", "troie"], "Q130543", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("trojan-war-ten-years", "trojan-war", "guerre-de-troie", "easy",
     "Combien de temps dure la guerre de Troie ?",
     ("Dix ans", "Trois ans", "Un an", "Vingt ans"),
     ["mythologie-grecque", "troie"], "Q207360", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("trojan-horse-odysseus-idea", "trojan-horse", "guerre-de-troie", "easy",
     "Qui est à l'origine de la ruse du cheval de Troie ?",
     ("Ulysse", "Achille", "Agamemnon", "Nestor"),
     ["mythologie-grecque", "troie"], "Q47220", 0.97, 0.94, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("iliad-author-homer", "homer-iliad", "guerre-de-troie", "easy",
     "Qui est l'auteur de l'Iliade ?",
     ("Homère", "Hésiode", "Eschyle", "Sophocle"),
     ["mythologie-grecque", "troie"], "Q6691", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("iliad-theme-achilles-wrath", "homer-iliad", "guerre-de-troie", "medium",
     "Quel est le sujet principal de l'Iliade ?",
     ("La colère d'Achille", "La fondation de Rome", "Le retour d'Ulysse", "La mort d'Héraclès"),
     ["mythologie-grecque", "troie"], "Q8275", 0.97, 0.94, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("odyssey-odysseus-return", "homer-odyssey", "guerre-de-troie", "easy",
     "Quel poème d'Homère raconte le retour d'Ulysse à Ithaque ?",
     ("L'Odyssée", "L'Iliade", "La Théogonie", "Les Travaux et les Jours"),
     ["mythologie-grecque", "troie"], "Q40175", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("hector-prince-of-troy", "trojan-war-heroes", "guerre-de-troie", "medium",
     "Quel prince troyen est le principal adversaire d'Achille ?",
     ("Hector", "Pâris", "Énée", "Priam"),
     ["mythologie-grecque", "troie"], "Q44252", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("achilles-drags-hector-body", "trojan-war-events", "guerre-de-troie", "hard",
     "Que fait Achille du corps d'Hector après l'avoir tué ?",
     ("Il le traîne derrière son char autour de Troie", "Il le brûle", "Il le rend à Priam aussitôt", "Il le jette dans la mer"),
     ["mythologie-grecque", "troie"], "Q41746", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("achilles-killed-by-paris", "trojan-war-events", "guerre-de-troie", "hard",
     "Qui tue Achille pendant la guerre de Troie ?",
     ("Pâris", "Hector", "Énée", "Sarpédon"),
     ["mythologie-grecque", "troie"], "Q41746", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("agamemnon-commander-of-greeks", "trojan-war-heroes", "guerre-de-troie", "medium",
     "Quel roi commande l'expédition grecque contre Troie ?",
     ("Agamemnon", "Ménélas", "Ulysse", "Nestor"),
     ["mythologie-grecque", "troie"], "Q128176", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("odysseus-king-of-ithaca", "trojan-war-heroes", "guerre-de-troie", "easy",
     "De quelle île Ulysse est-il le roi ?",
     ("Ithaque", "Chypre", "Crète", "Rhodes"),
     ["mythologie-grecque", "troie"], "Q47220", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("odysseus-tricks-polyphemus-nobody", "odyssey-episodes", "guerre-de-troie", "medium",
     "Quel nom Ulysse donne-t-il au Cyclope Polyphème pour le tromper ?",
     ("Personne", "Zeus", "Héros", "Étranger"),
     ["mythologie-grecque", "troie"], "Q47220", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("circe-turns-men-into-pigs", "odyssey-episodes", "guerre-de-troie", "medium",
     "Que fait la magicienne Circé aux compagnons d'Ulysse ?",
     ("Elle les transforme en cochons", "Elle les change en pierre", "Elle les endort pour cent ans", "Elle les rend aveugles"),
     ["mythologie-grecque", "troie"], "Q47220", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("odysseus-resists-sirens-mast", "odyssey-episodes", "guerre-de-troie", "hard",
     "Comment Ulysse résiste-t-il au chant des Sirènes ?",
     ("Il se fait attacher au mât du navire", "Il se bouche les oreilles avec de la cire", "Il chante plus fort qu'elles", "Il fait demi-tour"),
     ["mythologie-grecque", "troie"], "Q47220", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("scylla-and-charybdis", "odyssey-episodes", "guerre-de-troie", "hard",
     "Quels deux monstres gardent le détroit que doit franchir Ulysse ?",
     ("Charybde et Scylla", "Circé et Calypso", "Polyphème et Antiphatès", "Éole et Borée"),
     ["mythologie-grecque", "troie"], "Q47220", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("calypso-detains-odysseus", "odyssey-episodes", "guerre-de-troie", "hard",
     "Quelle nymphe retient Ulysse sur son île pendant sept ans ?",
     ("Calypso", "Circé", "Nausicaa", "Pénélope"),
     ["mythologie-grecque", "troie"], "Q47220", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("penelope-weaves-and-unweaves", "odyssey-episodes", "guerre-de-troie", "medium",
     "Quelle ruse Pénélope utilise-t-elle pour repousser ses prétendants ?",
     ("Elle tisse un linceul qu'elle défait chaque nuit", "Elle prétend être malade", "Elle s'enfuit du palais", "Elle fait jurer aux prétendants de patienter"),
     ["mythologie-grecque", "troie"], "Q47220", 0.97, 0.94, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("telemachus-son-of-odysseus", "odyssey-family", "guerre-de-troie", "hard",
     "Qui est Télémaque ?",
     ("Le fils d'Ulysse et de Pénélope", "Le frère d'Hélène", "Le cocher d'Achille", "Le devin des Grecs"),
     ["mythologie-grecque", "troie"], "Q47220", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("aeneas-flees-troy", "aeneas", "guerre-de-troie", "hard",
     "Quel héros troyen fuit Troie en flammes avec son père Anchise, devenant l'ancêtre légendaire des Romains ?",
     ("Énée", "Hector", "Pâris", "Anténor"),
     ["mythologie-grecque", "troie"], "Q47047", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("troy-location-asia-minor", "trojan-war-geography", "guerre-de-troie", "medium",
     "Où se trouvait la ville de Troie ?",
     ("En Asie Mineure, sur la côte de l'actuelle Turquie", "En Italie", "En Crète", "Dans le Péloponnèse"),
     ["mythologie-grecque", "troie"], "Q207360", 0.97, 0.94, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("homer-blind-aoidos", "homer-identity", "guerre-de-troie", "hard",
     "Selon la tradition, quelle particularité Homère avait-il ?",
     ("Il était aveugle", "Il était sourd", "Il était muet", "Il était boiteux"),
     ["mythologie-grecque", "troie"], "Q6691", 0.97, 0.93, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("iphigenia-sacrificed-by-agamemnon", "trojan-war-events", "guerre-de-troie", "expert",
     "Qui Agamemnon sacrifie-t-il pour obtenir des vents favorables ?",
     ("Sa fille Iphigénie", "Son fils Oreste", "Son neveu Achille", "Une prêtresse d'Artémis"),
     ["mythologie-grecque", "troie"], "Q128176", 0.96, 0.91, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("patroclus-killed-by-hector", "trojan-war-heroes", "guerre-de-troie", "medium",
     "Quel ami d'Achille est tué par Hector, provoquant le retour d'Achille au combat ?",
     ("Patrocle", "Antiloque", "Ajax", "Diomède"),
     ["mythologie-grecque", "troie"], "Q41746", 0.97, 0.94, CAT, "mythologie-grecque/grecque-troie-001.json"),

    ("odyssey-ten-years-return", "homer-odyssey", "guerre-de-troie", "medium",
     "Combien de temps dure le voyage de retour d'Ulysse vers Ithaque ?",
     ("Dix ans", "Un an", "Cinq ans", "Vingt ans"),
     ["mythologie-grecque", "troie"], "Q40175", 0.98, 0.95, CAT, "mythologie-grecque/grecque-troie-001.json"),
]
