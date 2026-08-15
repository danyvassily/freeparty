# -*- coding: utf-8 -*-
"""Questions MYTHOLOGIE ÉGYPTIENNE — dieux (Râ, Osiris, Isis, Horus, Seth, Anubis, Thot, Hathor, Maât, Sekhmet, Bastet, Amon, Ptah, Nephtys...), création, symboles."""
CAT = "mythologie-egyptienne"

QUESTIONS = [
    # ---------------- DIEUX 001 : Râ, Osiris, Isis, Horus, Seth, Anubis (36) ----------------
    ("ra-sun-god", "ra-identity", "dieux", "easy",
     "Quel dieu est le grand dieu solaire de l'Égypte ancienne ?",
     ("Râ", "Osiris", "Anubis", "Ptah"),
     ["mythologie-egyptienne", "ra"], "Q6587", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("ra-travels-in-solar-barge", "ra-journey", "dieux", "medium",
     "Comment Râ voyage-t-il dans le ciel pendant le jour ?",
     ("Dans une barque solaire", "Sur un char tiré par des chevaux", "Sur les ailes d'un faucon", "À dos d'hippopotame"),
     ["mythologie-egyptienne", "ra"], "Q6587", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("ra-crosses-the-duat-at-night", "ra-journey", "dieux", "hard",
     "Que traverse Râ pendant la nuit ?",
     ("La Douat, le monde souterrain", "Le Nil", "Le désert de Libye", "Les champs d'Ialou"),
     ["mythologie-egyptienne", "ra"], "Q6587", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("khepri-scarab-morning-form", "ra-forms", "dieux", "hard",
     "Sous quel nom et quelle forme Râ renaît-il chaque matin ?",
     ("Khépri, le scarabée", "Atoum, le serpent", "Horus, le faucon", "Apis, le taureau"),
     ["mythologie-egyptienne", "ra"], "Q6587", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("amun-ra-fusion", "ra-forms", "dieux", "medium",
     "Quel grand dieu de Thèbes fusionne avec Râ pour devenir le dieu suprême ?",
     ("Amon", "Ptah", "Osiris", "Khnoum"),
     ["mythologie-egyptienne", "ra"], "Q6587", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("atum-self-created-creator", "ra-forms", "dieux", "medium",
     "Dans la cosmogonie d'Héliopolis, quel dieu s'est créé lui-même avant de créer le monde ?",
     ("Atoum", "Geb", "Chou", "Seth"),
     ["mythologie-egyptienne", "ra"], "Q6587", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("osiris-god-of-afterlife", "osiris-identity", "dieux", "easy",
     "Quel dieu préside à l'au-delà et à la renaissance ?",
     ("Osiris", "Râ", "Thot", "Horus"),
     ["mythologie-egyptienne", "osiris"], "Q47699", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("seth-kills-osiris", "osiris-myth", "dieux", "easy",
     "Qui tue Osiris par jalousie ?",
     ("Seth", "Apopis", "Anubis", "Geb"),
     ["mythologie-egyptienne", "osiris"], "Q47699", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("osiris-dismembered-fourteen-pieces", "osiris-myth", "dieux", "hard",
     "Selon la version la plus répandue, en combien de morceaux Seth démembre-t-il Osiris ?",
     ("Quatorze", "Sept", "Trois", "Vingt et un"),
     ["mythologie-egyptienne", "osiris"], "Q47699", 0.94, 0.88, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("isis-revives-osiris", "osiris-myth", "dieux", "medium",
     "Qui rassemble les morceaux d'Osiris et lui rend vie ?",
     ("Isis", "Nephtys seule", "Maât", "Hathor"),
     ["mythologie-egyptienne", "osiris"], "Q47699", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("osiris-judge-of-the-dead", "osiris-roles", "dieux", "medium",
     "Quel rôle Osiris joue-t-il dans le tribunal des morts ?",
     ("Il préside le jugement de l'âme", "Il pèse le cœur", "Il écrit le verdict", "Il garde la balance"),
     ["mythologie-egyptienne", "osiris"], "Q47699", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("osiris-god-of-vegetation", "osiris-roles", "dieux", "hard",
     "À quel domaine naturel Osiris est-il aussi associé ?",
     ("À la végétation et à la renaissance des récoltes", "À la guerre et aux combats", "Aux éclipses", "Aux séismes"),
     ["mythologie-egyptienne", "osiris"], "Q47699", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("horus-father-osiris", "horus-genealogy", "dieux", "easy",
     "Qui est le père d'Horus ?",
     ("Osiris", "Râ", "Seth", "Geb"),
     ["mythologie-egyptienne", "horus"], "Q146733", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("isis-sister-wife-of-osiris", "isis-family", "dieux", "medium",
     "Quel lien unit Isis et Osiris ?",
     ("Ils sont frère et sœur et époux", "Ils sont simples alliés", "Ils sont cousins", "Ils sont maître et servante"),
     ["mythologie-egyptienne", "isis"], "Q41488", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("isis-goddess-of-magic", "isis-roles", "dieux", "medium",
     "Quelle déesse est réputée pour ses grands pouvoirs magiques ?",
     ("Isis", "Maât", "Nout", "Tefnout"),
     ["mythologie-egyptienne", "isis"], "Q41488", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("isis-protective-mother-goddess", "isis-roles", "dieux", "easy",
     "Quelle déesse incarne la maternité et protège les enfants ?",
     ("Isis", "Sekhmet", "Maât", "Nephtys"),
     ["mythologie-egyptienne", "isis"], "Q41488", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("isis-raises-horus-in-delta-marshes", "isis-myth", "dieux", "hard",
     "Où Isis élève-t-elle secrètement Horus ?",
     ("Dans les marais du Delta", "Dans le palais de Memphis", "Dans le temple de Karnak", "Sur la montagne de Thèbes"),
     ["mythologie-egyptienne", "isis"], "Q41488", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("isis-hieroglyph-throne", "isis-symbols", "dieux", "expert",
     "Que représente le hiéroglyphe qui écrit le nom d'Isis ?",
     ("Un trône", "Un œil", "Une plume", "Une barque"),
     ["mythologie-egyptienne", "isis"], "Q41488", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("isis-nephthys-sisters", "isis-family", "dieux", "hard",
     "Quelles deux déesses sont sœurs dans la grande Ennéade d'Héliopolis ?",
     ("Isis et Nephtys", "Hathor et Maât", "Bastet et Sekhmet", "Nout et Tefnout"),
     ["mythologie-egyptienne", "isis"], "Q41488", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("horus-falcon-god", "horus-identity", "dieux", "easy",
     "Sous quel animal Horus est-il représenté ?",
     ("Le faucon", "Le chacal", "Le crocodile", "L'ibis"),
     ["mythologie-egyptienne", "horus"], "Q146733", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("horus-avenges-osiris", "horus-myth", "dieux", "easy",
     "Qui Horus combat-il pour venger son père Osiris ?",
     ("Seth", "Apopis", "Râ", "Anubis"),
     ["mythologie-egyptienne", "horus"], "Q146733", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("eye-of-horus-oudjat", "horus-symbols", "dieux", "medium",
     "Qu'arrive-t-il à l'œil d'Horus au cours de son combat contre Seth ?",
     ("Il est arraché puis restauré", "Il devient aveugle", "Il pleure des larmes d'or", "Il se change en soleil"),
     ["mythologie-egyptienne", "horus"], "Q146733", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("thoth-restores-eye-of-horus", "horus-symbols", "dieux", "hard",
     "Quel dieu restaure l'œil d'Horus ?",
     ("Thot", "Anubis", "Khonsou", "Ptah"),
     ["mythologie-egyptienne", "horus"], "Q146733", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("pharaoh-horus-the-living", "horus-roles", "dieux", "medium",
     "Quel titre le pharaon porte-t-il en tant que souverain vivant ?",
     ("Horus vivant", "Fils de Seth", "Serviteur d'Apopis", "Époux de Maât"),
     ["mythologie-egyptienne", "horus"], "Q146733", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("seth-god-of-chaos", "seth-identity", "dieux", "medium",
     "Quel dieu incarne le chaos, la violence et le désert ?",
     ("Seth", "Thot", "Khnoum", "Bès"),
     ["mythologie-egyptienne", "seth"], "Q147201", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("seth-unknown-animal", "seth-symbols", "dieux", "hard",
     "Quel animal représente Seth dans l'art égyptien ?",
     ("Un animal imaginaire non identifié", "Le chat", "L'ibis", "L'hippopotame"),
     ["mythologie-egyptienne", "seth"], "Q147201", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("seth-uncle-of-horus", "seth-family", "dieux", "hard",
     "Quel lien de parenté unit Seth et Horus ?",
     ("Seth est l'oncle d'Horus", "Seth est le père d'Horus", "Seth est le frère d'Horus", "Seth est le cousin d'Horus"),
     ["mythologie-egyptienne", "seth"], "Q147201", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("seth-wife-nephthys", "seth-family", "dieux", "hard",
     "Quelle déesse est l'épouse de Seth ?",
     ("Nephtys", "Isis", "Nout", "Tefnout"),
     ["mythologie-egyptienne", "seth"], "Q147201", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("anubis-jackal-headed", "anubis-identity", "dieux", "easy",
     "Quel dieu est représenté avec une tête de chacal ?",
     ("Anubis", "Horus", "Thot", "Sobek"),
     ["mythologie-egyptienne", "anubis"], "Q146585", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("anubis-god-of-mummification", "anubis-roles", "dieux", "medium",
     "Quel dieu préside à la momification et à l'embaumement ?",
     ("Anubis", "Râ", "Osiris", "Khnoum"),
     ["mythologie-egyptienne", "anubis"], "Q146585", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("anubis-protector-of-necropolises", "anubis-roles", "dieux", "hard",
     "Quel dieu protège les nécropoles ?",
     ("Anubis", "Bès", "Ptah", "Khonsou"),
     ["mythologie-egyptienne", "anubis"], "Q146585", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("anubis-father-osiris", "anubis-genealogy", "dieux", "expert",
     "Selon la tradition la plus répandue, qui est le père d'Anubis ?",
     ("Osiris", "Seth", "Geb", "Râ"),
     ["mythologie-egyptienne", "anubis"], "Q146585", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("isis-protective-wings", "isis-symbols", "dieux", "medium",
     "Quelle déesse est souvent représentée avec de grandes ailes protectrices ?",
     ("Isis", "Bastet", "Sekhmet", "Nout"),
     ["mythologie-egyptienne", "isis"], "Q41488", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("osiris-green-skin", "osiris-symbols", "dieux", "hard",
     "De quelle couleur est généralement la peau d'Osiris dans les représentations ?",
     ("Verte", "Rouge", "Bleue", "Dorée"),
     ["mythologie-egyptienne", "osiris"], "Q47699", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("horus-mother-isis", "horus-genealogy", "dieux", "easy",
     "Quelle déesse est la mère d'Horus ?",
     ("Isis", "Hathor", "Maât", "Nephtys"),
     ["mythologie-egyptienne", "horus"], "Q146733", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    ("osiris-mummiform-representation", "osiris-symbols", "dieux", "hard",
     "Quel dieu est souvent représenté momiforme, c'est-à-dire emmailloté comme une momie ?",
     ("Osiris", "Anubis", "Thot", "Ptah"),
     ["mythologie-egyptienne", "osiris"], "Q47699", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-001.json"),

    # ---------------- DIEUX 002 : Thot, Hathor, Maât, Sekhmet, Bastet, Amon, Ptah, Nephtys + autres (32) ----------------
    ("thoth-god-of-wisdom-and-writing", "thoth-roles", "dieux", "easy",
     "Quel dieu est le patron de la sagesse et de l'écriture ?",
     ("Thot", "Seth", "Anubis", "Horus"),
     ["mythologie-egyptienne", "thot"], "Q185742", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("thoth-ibis-headed", "thoth-identity", "dieux", "medium",
     "Quel oiseau est associé à Thot ?",
     ("L'ibis", "Le faucon", "Le vautour", "La cigogne"),
     ["mythologie-egyptienne", "thot"], "Q185742", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("thoth-records-the-weighing", "thoth-roles", "dieux", "medium",
     "Quel rôle Thot joue-t-il lors du jugement des morts ?",
     ("Il enregistre le résultat de la pesée du cœur", "Il pèse le cœur lui-même", "Il dévore les coupables", "Il conduit l'âme aux champs d'Ialou"),
     ["mythologie-egyptienne", "thot"], "Q185742", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("thot-moon-god", "thot-identity", "dieux", "hard",
     "À quel astre Thot est-il également associé ?",
     ("À la Lune", "Au Soleil", "Aux étoiles filantes", "À Vénus"),
     ["mythologie-egyptienne", "thot"], "Q185742", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("hathor-goddess-of-love-and-joy", "hathor-roles", "dieux", "easy",
     "Quelle déesse incarne l'amour, la joie, la musique et la danse ?",
     ("Hathor", "Maât", "Sekhmet", "Nephtys"),
     ["mythologie-egyptienne", "hathor"], "Q134259", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("hathor-celestial-cow", "hathor-identity", "dieux", "medium",
     "Sous quelle forme animale Hathor est-elle souvent représentée ?",
     ("Une vache", "Une lionne", "Une chatte", "Un cobra"),
     ["mythologie-egyptienne", "hathor"], "Q134259", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("hathor-protector-of-women", "hathor-roles", "dieux", "medium",
     "Qui Hathor protège-t-elle tout particulièrement ?",
     ("Les femmes et les nouveau-nés", "Les soldats", "Les scribes", "Les paysans"),
     ["mythologie-egyptienne", "hathor"], "Q134259", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("hathor-sistrum-instrument", "hathor-symbols", "dieux", "hard",
     "Quel instrument de musique sacré est associé au culte d'Hathor ?",
     ("Le sistre", "La harpe", "La flûte double", "Le tambour"),
     ["mythologie-egyptienne", "hathor"], "Q134259", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("maat-goddess-of-truth", "maat-roles", "dieux", "easy",
     "Quelle déesse personnifie la vérité et la justice ?",
     ("Maât", "Bastet", "Nout", "Tefnout"),
     ["mythologie-egyptienne", "maat"], "Q187377", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("maat-ostrich-feather", "maat-symbols", "dieux", "medium",
     "Quel objet est l'attribut de Maât ?",
     ("La plume d'autruche", "L'ankh", "Le sceptre ouas", "La croix ansée"),
     ["mythologie-egyptienne", "maat"], "Q187377", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("maat-cosmic-order", "maat-roles", "dieux", "medium",
     "Que représente Maât dans la pensée égyptienne ?",
     ("L'ordre juste du monde", "La crue du Nil", "La fertilité des champs", "La puissance guerrière"),
     ["mythologie-egyptienne", "maat"], "Q187377", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("sekhmet-lioness-goddess", "sekhmet-identity", "dieux", "medium",
     "Quelle déesse à tête de lionne incarne la guerre et la destruction ?",
     ("Sekhmet", "Bastet", "Hathor", "Isis"),
     ["mythologie-egyptienne", "sekhmet"], "Q184756", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("sekhmet-wife-of-ptah", "sekhmet-family", "dieux", "hard",
     "Qui est l'épouse du dieu Ptah, déesse à tête de lionne ?",
     ("Sekhmet", "Nout", "Nephtys", "Maât"),
     ["mythologie-egyptienne", "sekhmet"], "Q184756", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("sekhmet-eye-of-ra", "sekhmet-roles", "dieux", "hard",
     "Quel titre guerrier Sekhmet porte-t-elle souvent ?",
     ("L'Œil de Râ", "La Fille d'Osiris", "La Sœur d'Anubis", "L'Épouse d'Horus"),
     ["mythologie-egyptienne", "sekhmet"], "Q184756", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("bastet-cat-goddess", "bastet-identity", "dieux", "easy",
     "Quelle déesse est représentée avec une tête de chatte ?",
     ("Bastet", "Sekhmet", "Tefnout", "Nephtys"),
     ["mythologie-egyptienne", "bastet"], "Q132707", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("bastet-protector-of-the-home", "bastet-roles", "dieux", "medium",
     "Quelle déesse protège le foyer et la maison ?",
     ("Bastet", "Sekhmet", "Ouadjet", "Nekhbet"),
     ["mythologie-egyptienne", "bastet"], "Q132707", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("bastet-cult-center-bubastis", "bastet-cult", "dieux", "hard",
     "Quelle ville est le grand centre de culte de Bastet ?",
     ("Bubastis", "Abydos", "Saïs", "Éléphantine"),
     ["mythologie-egyptienne", "bastet"], "Q132707", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("amun-god-of-thebes", "amun-identity", "dieux", "medium",
     "Quel dieu est le grand dieu de la ville de Thèbes ?",
     ("Amon", "Seth", "Anubis", "Khnoum"),
     ["mythologie-egyptienne", "amon"], "Q101851", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("amun-karnak-temple", "amun-cult", "dieux", "medium",
     "Quel immense temple est consacré à Amon ?",
     ("Karnak", "Abou Simbel", "Edfou", "Philae"),
     ["mythologie-egyptienne", "amon"], "Q101851", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("amun-the-hidden-one", "amun-identity", "dieux", "hard",
     "Que signifie le nom d'Amon ?",
     ("Le caché", "Le puissant", "Le soleil", "Le créateur"),
     ["mythologie-egyptienne", "amon"], "Q101851", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("ptah-creator-god-of-memphis", "ptah-identity", "dieux", "medium",
     "Quel dieu créateur est vénéré à Memphis ?",
     ("Ptah", "Atoum", "Geb", "Râ"),
     ["mythologie-egyptienne", "ptah"], "Q180207", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("ptah-patron-of-artisans", "ptah-roles", "dieux", "hard",
     "Quelle corporation Ptah protège-t-il ?",
     ("Les artisans et les forgerons", "Les pêcheurs", "Les scribes", "Les médecins"),
     ["mythologie-egyptienne", "ptah"], "Q180207", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("ptah-creates-by-thought-and-word", "ptah-roles", "dieux", "expert",
     "Selon la théologie memphite, comment Ptah crée-t-il le monde ?",
     ("Par la pensée et la parole", "Par la magie du sang", "Par le combat", "Par le souffle du vent"),
     ["mythologie-egyptienne", "ptah"], "Q180207", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("nephthys-funerary-goddess", "nephthys-roles", "dieux", "hard",
     "Quelle déesse assiste Isis dans les rites funéraires ?",
     ("Nephtys", "Hathor", "Bastet", "Sekhmet"),
     ["mythologie-egyptienne", "nephthys"], "Q195628", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("nephthys-sister-of-isis", "nephthys-family", "dieux", "medium",
     "Qui est Nephtys dans la fratrie divine ?",
     ("La sœur d'Isis, d'Osiris et de Seth", "La fille de Râ", "La femme de Thot", "La mère de Bastet"),
     ["mythologie-egyptienne", "nephthys"], "Q195628", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("nephthys-isis-canopic-jars", "nephthys-roles", "dieux", "expert",
     "Avec quelle déesse Nephtys protège-t-elle les vases canopes ?",
     ("Isis", "Maât", "Nout", "Tefnout"),
     ["mythologie-egyptienne", "nephthys"], "Q195628", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("geb-god-of-the-earth", "geb-identity", "dieux", "medium",
     "Quel dieu est la personnification de la Terre ?",
     ("Geb", "Chou", "Noun", "Seth"),
     ["mythologie-egyptienne", "dieux"], "Q182510", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("nut-goddess-of-the-sky", "nut-identity", "dieux", "medium",
     "Quelle déesse est la personnification du Ciel ?",
     ("Nout", "Gaïa", "Maât", "Bastet"),
     ["mythologie-egyptienne", "dieux"], "Q207006", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("tefnout-goddess-of-moisture", "tefnout-identity", "dieux", "expert",
     "Quelle déesse, parfois à tête de lionne, est la déesse de l'humidité ?",
     ("Tefnout", "Bastet", "Hathor", "Maât"),
     ["mythologie-egyptienne", "dieux"], "Q207006", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("apep-serpent-enemy-of-ra", "apep-identity", "dieux", "medium",
     "Quel serpent géant est l'ennemi de Râ ?",
     ("Apopis", "Ouroboros", "l'Uræus", "le cobra sacré"),
     ["mythologie-egyptienne", "dieux"], "Q6587", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("sobek-crocodile-god", "sobek-identity", "dieux", "medium",
     "Quel dieu est représenté avec une tête de crocodile ?",
     ("Sobek", "Bès", "Anubis", "Thot"),
     ["mythologie-egyptienne", "dieux"], "Q182562", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    ("khnum-ram-headed-potter", "khnum-identity", "dieux", "hard",
     "Quel dieu à tête de bélier façonne les humains sur son tour de potier ?",
     ("Khnoum", "Amon", "Ptah", "Seth"),
     ["mythologie-egyptienne", "dieux"], "Q182320", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-dieux-002.json"),

    # ---------------- CRÉATION (8) ----------------
    ("nun-primordial-ocean", "creation-cosmogonies", "creation", "medium",
     "Comment s'appelle l'océan primordial d'où tout est issu selon les Égyptiens ?",
     ("Le Noun", "Le Nil", "La Douat", "L'Ialou"),
     ["mythologie-egyptienne", "creation"], "Q6587", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-creation-001.json"),

    ("primeval-mound", "creation-cosmogonies", "creation", "hard",
     "Selon les cosmogonies égyptiennes, sur quoi le dieu créateur se tient-il au commencement ?",
     ("La butte primordiale", "Un rocher de granit", "Le dos d'un crocodile", "Un trône d'or"),
     ["mythologie-egyptienne", "creation"], "Q6587", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-creation-001.json"),

    ("atum-creator-of-heliopolis", "creation-cosmogonies", "creation", "medium",
     "Quel dieu est le créateur dans la cosmogonie d'Héliopolis ?",
     ("Atoum", "Ptah", "Khnoum", "Amon"),
     ["mythologie-egyptienne", "creation"], "Q6587", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-creation-001.json"),

    ("ennead-nine-gods", "creation-cosmogonies", "creation", "hard",
     "Combien de dieux compte l'Ennéade d'Héliopolis ?",
     ("Neuf", "Sept", "Douze", "Quatre"),
     ["mythologie-egyptienne", "creation"], "Q6587", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-creation-001.json"),

    ("shu-and-tefnout-children-of-atum", "creation-cosmogonies", "creation", "hard",
     "Quels sont les deux premiers dieux engendrés par Atoum ?",
     ("Chou et Tefnout", "Geb et Nout", "Osiris et Isis", "Seth et Nephtys"),
     ["mythologie-egyptienne", "creation"], "Q6587", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-creation-001.json"),

    ("ogdoad-eight-deities", "creation-cosmogonies", "creation", "expert",
     "Combien de divinités composent l'Ogdoade d'Hermopolis ?",
     ("Huit", "Quatre", "Dix", "Six"),
     ["mythologie-egyptienne", "creation"], "Q6587", 0.96, 0.91, CAT, "mythologie-egyptienne/egyptienne-creation-001.json"),

    ("shu-separates-nut-and-geb", "creation-cosmogonies", "creation", "hard",
     "Quel dieu sépare la déesse du ciel Nout du dieu de la terre Geb ?",
     ("Chou", "Râ", "Thot", "Anubis"),
     ["mythologie-egyptienne", "creation"], "Q6587", 0.97, 0.93, CAT, "mythologie-egyptienne/egyptienne-creation-001.json"),

    ("cosmic-egg-of-hermopolis", "creation-cosmogonies", "creation", "expert",
     "Selon la cosmogonie d'Hermopolis, que pond l'oie primordiale ?",
     ("L'œuf d'où naît le soleil", "Une pierre sacrée", "Un lotus d'or", "Un serpent géant"),
     ["mythologie-egyptienne", "creation"], "Q6587", 0.95, 0.90, CAT, "mythologie-egyptienne/egyptienne-creation-001.json"),

    # ---------------- SYMBOLES (8) ----------------
    ("ankh-symbol-of-life", "egyptian-symbols", "symboles", "easy",
     "Que symbolise l'ankh, la croix à anse ?",
     ("La vie", "La mort", "La guerre", "La richesse"),
     ["mythologie-egyptienne", "symboles"], "Q134403", 0.98, 0.95, CAT, "mythologie-egyptienne/egyptienne-symboles-001.json"),

    ("oudjat-eye-of-horus", "egyptian-symbols", "symboles", "easy",
     "Que représente l'œil oudjat ?",
     ("L'œil d'Horus, symbole de protection et de santé", "L'œil de Râ, symbole de destruction", "L'œil de Maât, symbole de jugement", "L'œil d'Anubis, symbole de deuil"),
     ["mythologie-egyptienne", "symboles"], "Q146733", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-symboles-001.json"),

    ("scarab-beetle-rebirth", "egyptian-symbols", "symboles", "medium",
     "Quel insecte, symbole de renaissance et de régénération, est associé au soleil levant ?",
     ("Le scarabée", "L'abeille", "La libellule", "Le scorpion"),
     ["mythologie-egyptienne", "symboles"], "Q6587", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-symboles-001.json"),

    ("djed-pillar-stability", "egyptian-symbols", "symboles", "hard",
     "Que symbolise le pilier djed ?",
     ("La stabilité, associé à Osiris", "La fertilité, associé à Isis", "La guerre, associé à Seth", "La sagesse, associé à Thot"),
     ["mythologie-egyptienne", "symboles"], "Q47699", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-symboles-001.json"),

    ("maat-feather-truth", "egyptian-symbols", "symboles", "medium",
     "Quel objet représente la vérité et la justice dans l'iconographie égyptienne ?",
     ("La plume d'autruche de Maât", "L'épée de Sekhmet", "Le sceptre de Râ", "La balance d'Anubis"),
     ["mythologie-egyptienne", "symboles"], "Q187377", 0.97, 0.94, CAT, "mythologie-egyptienne/egyptienne-symboles-001.json"),

    ("sistrum-sacred-rattle", "egyptian-symbols", "symboles", "hard",
     "Quel instrument à percussion, sorte de hochet sacré, accompagne les rites d'Hathor ?",
     ("Le sistre", "Le tambourin", "Les castagnettes", "Le gong"),
     ["mythologie-egyptienne", "symboles"], "Q134259", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-symboles-001.json"),

    ("lotus-upper-egypt-emblem", "egyptian-symbols", "symboles", "medium",
     "Quelle fleur est l'emblème de la Haute-Égypte ?",
     ("Le lotus", "Le papyrus", "Le lys", "La rose"),
     ["mythologie-egyptienne", "symboles"], "Q6587", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-symboles-001.json"),

    ("papyrus-lower-egypt-emblem", "egyptian-symbols", "symboles", "medium",
     "Quelle plante est l'emblème de la Basse-Égypte ?",
     ("Le papyrus", "Le lotus", "Le roseau", "Le palmier"),
     ["mythologie-egyptienne", "symboles"], "Q6587", 0.96, 0.92, CAT, "mythologie-egyptienne/egyptienne-symboles-001.json"),
]
