# -*- coding: utf-8 -*-
"""Questions PHILOSOPHIE — philosophie antique (présocratiques, Socrate, Platon, Aristote, Épicure) et stoïcisme."""
CAT = "philosophie"

QUESTIONS = [
    # ---------------- PHILOSOPHIE ANTIQUE (38) ----------------
    ("thales-first-philosopher-water", "milesian-school", "philosophie-antique", "medium",
     "Quel penseur de Milet, souvent considéré comme le premier philosophe, fait de l'eau le principe de toutes choses ?",
     ("Thalès", "Héraclite", "Démocrite", "Pythagore"),
     ["philosophie", "antique"], "Q37707", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("thales-school-of-miletus", "milesian-school", "philosophie-antique", "hard",
     "Comment s'appelle la première école philosophique grecque, fondée à Milet ?",
     ("L'école de Milet", "L'Académie", "Le Lycée", "Le Portique"),
     ["philosophie", "antique"], "Q37707", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("heraclitus-everything-flows", "heraclitus-doctrine", "philosophie-antique", "medium",
     "Quel philosophe affirme que « tout coule » et que le monde est en perpétuel devenir ?",
     ("Héraclite", "Parménide", "Zénon", "Anaximandre"),
     ["philosophie", "antique"], "Q41155", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("heraclitus-fire-as-principle", "heraclitus-doctrine", "philosophie-antique", "hard",
     "Quel élément Héraclite fait-il du principe du monde ?",
     ("Le feu", "L'eau", "L'air", "La terre"),
     ["philosophie", "antique"], "Q41155", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("democritus-theory-of-atoms", "atomism", "philosophie-antique", "medium",
     "Quel philosophe grec est le père de la théorie des atomes ?",
     ("Démocrite", "Épicure", "Empédocle", "Anaxagore"),
     ["philosophie", "antique"], "Q41980", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("pythagoras-everything-is-number", "pythagoreanism", "philosophie-antique", "medium",
     "Quel penseur affirme que « tout est nombre » ?",
     ("Pythagore", "Thalès", "Protagoras", "Gorgias"),
     ["philosophie", "antique"], "Q102174", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("parmenides-being-is-unchanging", "eleatic-school", "philosophie-antique", "hard",
     "Quel philosophe soutient que l'être est immuable et que le changement n'est qu'illusion ?",
     ("Parménide", "Héraclite", "Démocrite", "Empédocle"),
     ["philosophie", "antique"], "Q173300", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("protagoras-man-is-the-measure", "sophists", "philosophie-antique", "hard",
     "Quel sophiste déclare que « l'homme est la mesure de toutes choses » ?",
     ("Protagoras", "Gorgias", "Antiphon", "Critias"),
     ["philosophie", "antique"], "Q167107", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("socrates-maiutics-method", "socratic-method", "philosophie-antique", "medium",
     "Comment Socrate compare-t-il sa méthode d'enseignement ?",
     ("À l'art de la sage-femme qui accouche les esprits", "À la sculpture", "À la navigation", "À la guerre"),
     ["philosophie", "socrate"], "Q29", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("socrates-wrote-nothing", "socrates-identity", "philosophie-antique", "easy",
     "Quelle particularité a l'œuvre écrite de Socrate ?",
     ("Il n'a rien écrit", "Il n'a écrit que des poèmes", "Il a écrit une seule tragédie", "Il a écrit des lettres"),
     ["philosophie", "socrate"], "Q29", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("socrates-executed-by-hemlock", "socrates-trial", "philosophie-antique", "medium",
     "Comment Socrate est-il exécuté ?",
     ("En buvant la ciguë", "En étant crucifié", "En étant lapidé", "En étant noyé"),
     ["philosophie", "socrate"], "Q29", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("socrates-know-thyself", "socratic-maxims", "philosophie-antique", "medium",
     "Quelle inscription du temple de Delphes Socrate fait-il sienne ?",
     ("« Connais-toi toi-même »", "« Rien de trop »", "« Tout est vanité »", "« Carpe diem »"),
     ["philosophie", "socrate"], "Q29", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("socrates-i-know-that-i-know-nothing", "socratic-maxims", "philosophie-antique", "easy",
     "Quelle formule résume la position de Socrate sur son propre savoir ?",
     ("« Je sais que je ne sais rien »", "« Je sais tout »", "« Le savoir est un don divin »", "« La science est dans les livres »"),
     ["philosophie", "socrate"], "Q29", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("socrates-dialogues-in-the-agora", "socrates-identity", "philosophie-antique", "hard",
     "Où Socrate dialogue-t-il avec les Athéniens ?",
     ("Sur l'agora d'Athènes", "À l'Académie", "Au Lycée", "À la cour de Périclès"),
     ["philosophie", "socrate"], "Q29", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-student-of-socrates", "socrates-legacy", "philosophie-antique", "easy",
     "Qui est le plus célèbre élève de Socrate ?",
     ("Platon", "Aristote", "Xénophon", "Isocrate"),
     ["philosophie", "socrate"], "Q29", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("socrates-accused-of-corrupting-youth", "socrates-trial", "philosophie-antique", "hard",
     "Quelle est l'accusation portée contre Socrate lors de son procès ?",
     ("Corrompre la jeunesse et ne pas honorer les dieux de la cité", "Voler les trésors d'Athènes", "Trahir Athènes pour Sparte", "Détruire les statues des dieux"),
     ["philosophie", "socrate"], "Q29", 0.97, 0.93, CAT, "philosophie/philosophie-antique-001.json"),

    ("socratic-irony", "socratic-method", "philosophie-antique", "hard",
     "Comment appelle-t-on l'attitude de Socrate qui feint l'ignorance pour amener son interlocuteur à reconnaître ses erreurs ?",
     ("L'ironie socratique", "Le cynisme", "Le scepticisme", "La sophistique"),
     ["philosophie", "socrate"], "Q29", 0.97, 0.93, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-foundation-of-the-academy", "plato-institutions", "philosophie-antique", "medium",
     "Quelle école Platon fonde-t-il à Athènes ?",
     ("L'Académie", "Le Lycée", "Le Jardin", "Le Portique"),
     ["philosophie", "platon"], "Q859", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-allegory-of-the-cave", "platonic-theory", "philosophie-antique", "easy",
     "Dans quelle œuvre Platon raconte-t-il l'allégorie de la caverne ?",
     ("La République", "Le Banquet", "Le Phédon", "Le Timée"),
     ["philosophie", "platon"], "Q859", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-theory-of-forms", "platonic-theory", "philosophie-antique", "medium",
     "Quelle est la théorie centrale de la philosophie de Platon ?",
     ("La théorie des Idées", "La théorie des atomes", "Le matérialisme dialectique", "L'empirisme radical"),
     ["philosophie", "platon"], "Q859", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-myth-of-atlantis", "platonic-myths", "philosophie-antique", "medium",
     "Quel philosophe raconte le mythe de l'Atlantide ?",
     ("Platon", "Aristote", "Homère", "Hésiode"),
     ["philosophie", "platon"], "Q859", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-philosopher-king", "platonic-politics", "philosophie-antique", "medium",
     "Selon Platon, qui doit gouverner la cité idéale ?",
     ("Les philosophes", "Les soldats", "Les marchands", "Les artisans"),
     ["philosophie", "platon"], "Q859", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-symposium-on-love", "platonic-works", "philosophie-antique", "medium",
     "Quel dialogue de Platon traite de la nature de l'amour ?",
     ("Le Banquet", "Le Criton", "Le Gorgias", "Le Ménon"),
     ["philosophie", "platon"], "Q859", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-intelligible-world", "platonic-theory", "philosophie-antique", "hard",
     "Comment Platon appelle-t-il le monde des réalités éternelles et parfaites ?",
     ("Le monde intelligible", "Le monde sensible", "Le cosmos", "L'hypercosme"),
     ["philosophie", "platon"], "Q859", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("plato-doxa-vs-knowledge", "platonic-epistemology", "philosophie-antique", "hard",
     "Quel terme grec Platon emploie-t-il pour désigner l'opinion, opposée au savoir ?",
     ("La doxa", "L'épistémè", "La phronesis", "L'aporie"),
     ["philosophie", "platon"], "Q859", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-foundation-of-the-lyceum", "aristotle-institutions", "philosophie-antique", "medium",
     "Quelle école Aristote fonde-t-il ?",
     ("Le Lycée", "L'Académie", "Le Jardin", "L'école d'Élée"),
     ["philosophie", "aristote"], "Q868", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-tutor-of-alexander", "aristotle-biography", "philosophie-antique", "medium",
     "Quel grand conquérant Aristote a-t-il eu pour élève ?",
     ("Alexandre le Grand", "Jules César", "Cyrus", "Hannibal"),
     ["philosophie", "aristote"], "Q868", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-golden-mean", "aristotelian-ethics", "philosophie-antique", "medium",
     "Selon Aristote, où se situe la vertu ?",
     ("Dans le juste milieu entre deux excès", "Dans l'absence de désirs", "Dans la soumission aux dieux", "Dans la richesse"),
     ["philosophie", "aristote"], "Q868", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-political-animal", "aristotelian-politics", "philosophie-antique", "easy",
     "Quel philosophe a écrit que « l'homme est par nature un animal politique » ?",
     ("Aristote", "Platon", "Épicure", "Diogène"),
     ["philosophie", "aristote"], "Q868", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-syllogism", "aristotelian-logic", "philosophie-antique", "medium",
     "Quel philosophe a formalisé le syllogisme ?",
     ("Aristote", "Socrate", "Thalès", "Zénon"),
     ["philosophie", "aristote"], "Q868", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-student-of-plato", "aristotle-biography", "philosophie-antique", "easy",
     "Qui fut le maître d'Aristote ?",
     ("Platon", "Socrate", "Anaxagore", "Démocrite"),
     ["philosophie", "aristote"], "Q868", 0.98, 0.95, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-act-and-potency", "aristotelian-metaphysics", "philosophie-antique", "hard",
     "Quels deux concepts Aristote oppose-t-il pour expliquer le changement ?",
     ("L'acte et la puissance", "Le bien et le mal", "L'âme et le corps", "Le fini et l'infini"),
     ["philosophie", "aristote"], "Q868", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-final-cause", "aristotelian-metaphysics", "philosophie-antique", "hard",
     "Parmi les quatre causes d'Aristote, laquelle désigne la fin ou le but d'une chose ?",
     ("La cause finale", "La cause matérielle", "La cause efficiente", "La cause formelle"),
     ["philosophie", "aristote"], "Q868", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    ("aristotle-nicomachean-ethics", "aristotelian-ethics", "philosophie-antique", "medium",
     "Qui a écrit l'Éthique à Nicomaque ?",
     ("Aristote", "Platon", "Épicure", "Sénèque"),
     ["philosophie", "aristote"], "Q868", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("epicurus-the-garden-school", "epicureanism-school", "philosophie-antique", "medium",
     "Comment s'appelle l'école fondée par Épicure ?",
     ("Le Jardin", "Le Portique", "L'Académie", "Le Lycée"),
     ["philosophie", "epicure"], "Q43209", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("epicurus-ataraxia", "epicurean-ethics", "philosophie-antique", "medium",
     "Quel terme désigne l'absence de trouble de l'âme, but de la sagesse épicurienne ?",
     ("L'ataraxie", "L'apathie", "L'asthénie", "L'aporie"),
     ["philosophie", "epicure"], "Q43209", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("epicurus-pleasure-as-highest-good", "epicurean-ethics", "philosophie-antique", "easy",
     "Quel est le bien suprême selon Épicure ?",
     ("Le plaisir", "La vertu", "La gloire", "La richesse"),
     ["philosophie", "epicure"], "Q43209", 0.97, 0.94, CAT, "philosophie/philosophie-antique-001.json"),

    ("epicurus-death-is-nothing-to-us", "epicurean-ethics", "philosophie-antique", "hard",
     "Quelle formule résume la position d'Épicure sur la mort ?",
     ("« La mort n'est rien pour nous »", "« La mort est une délivrance »", "« La mort est un passage »", "« La mort est un mystère sacré »"),
     ["philosophie", "epicure"], "Q43209", 0.96, 0.92, CAT, "philosophie/philosophie-antique-001.json"),

    # ---------------- STOÏCISME (18) ----------------
    ("zeno-of-citium-founder-of-stoicism", "stoicism-foundation", "stoicisme", "medium",
     "Qui fonde le stoïcisme vers 300 av. J.-C. ?",
     ("Zénon de Cition", "Épicure", "Socrate", "Diogène"),
     ["philosophie", "stoicisme"], "Q171315", 0.97, 0.94, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("the-porch-stoa-poikile", "stoicism-foundation", "stoicisme", "hard",
     "Pourquoi l'école stoïcienne est-elle appelée « le Portique » ?",
     ("Zénon enseignait sous un portique peint d'Athènes", "Le bâtiment était en marbre du Portique", "Le mot vient du latin « portus »", "Les stoïciens vendaient des tissus"),
     ["philosophie", "stoicisme"], "Q171315", 0.96, 0.92, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("stoics-virtue-is-the-only-good", "stoic-ethics", "stoicisme", "medium",
     "Quel est le seul vrai bien selon les stoïciens ?",
     ("La vertu", "Le plaisir", "La santé", "La richesse"),
     ["philosophie", "stoicisme"], "Q171315", 0.97, 0.94, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("stoics-apatheia-absence-of-passions", "stoic-ethics", "stoicisme", "medium",
     "Comment appelle-t-on l'idéal stoïcien d'absence de passions ?",
     ("L'apathie", "L'ataraxie", "La catharsis", "L'hybris"),
     ["philosophie", "stoicisme"], "Q171315", 0.96, 0.92, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("stoics-live-in-accordance-with-nature", "stoic-ethics", "stoicisme", "hard",
     "Quel précepte résume la morale stoïcienne ?",
     ("Vivre conformément à la nature et à la raison", "Jouir de l'instant présent", "Fuir la société", "Rechercher la gloire"),
     ["philosophie", "stoicisme"], "Q171315", 0.96, 0.92, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("epictetus-dichotomy-of-control", "epictetus-doctrine", "stoicisme", "medium",
     "Quelle distinction fondamentale Épictète enseigne-t-il au début de son Manuel ?",
     ("Ce qui dépend de nous et ce qui n'en dépend pas", "Le bien et le mal", "Le vrai et le faux", "L'âme et le corps"),
     ["philosophie", "epictete"], "Q177463", 0.97, 0.94, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("epictetus-former-slave", "epictetus-biography", "stoicisme", "hard",
     "Quel était le statut d'Épictète avant de devenir philosophe ?",
     ("Il était esclave", "Il était empereur", "Il était médecin", "Il était soldat"),
     ["philosophie", "epictete"], "Q177463", 0.97, 0.93, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("epictetus-enchiridion-manual", "epictetus-works", "stoicisme", "medium",
     "Comment s'appelle le petit manuel pratique d'Épictète, recueilli par son disciple Arrien ?",
     ("Le Manuel", "Les Entretiens", "Les Lettres", "Les Maximes"),
     ["philosophie", "epictete"], "Q177463", 0.97, 0.94, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("seneca-letters-to-lucilius", "seneca-works", "stoicisme", "easy",
     "Quelle œuvre célèbre Sénèque adresse-t-il à son ami Lucilius ?",
     ("Les Lettres à Lucilius", "Les Pensées pour moi-même", "Le Manuel", "Les Confessions"),
     ["philosophie", "seneca"], "Q2054", 0.98, 0.95, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("seneca-tutor-of-nero", "seneca-biography", "stoicisme", "hard",
     "Quel empereur romain Sénèque a-t-il été le précepteur ?",
     ("Néron", "Auguste", "Caligula", "Trajan"),
     ["philosophie", "seneca"], "Q2054", 0.97, 0.93, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("seneca-on-the-brevity-of-life", "seneca-works", "stoicisme", "hard",
     "Quel traité de Sénèque porte sur le temps qui nous échappe ?",
     ("De la brièveté de la vie", "De la nature des choses", "Du contrat social", "De l'esprit des lois"),
     ["philosophie", "seneca"], "Q2054", 0.96, 0.92, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("marcus-aurelius-philosopher-emperor", "marcus-aurelius", "stoicisme", "easy",
     "Quel philosophe stoïcien est également empereur romain ?",
     ("Marc Aurèle", "Néron", "Hadrien", "Commode"),
     ["philosophie", "marc-aurele"], "Q1410", 0.98, 0.95, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("marcus-aurelius-meditations-title", "marcus-aurelius-works", "stoicisme", "medium",
     "Quel est le titre de l'œuvre personnelle de Marc Aurèle ?",
     ("Pensées pour moi-même", "Lettres à Lucilius", "Le Manuel", "Les Confessions"),
     ["philosophie", "marc-aurele"], "Q1410", 0.97, 0.94, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("marcus-aurelius-successor-commodus", "marcus-aurelius", "stoicisme", "hard",
     "Marc Aurèle est le dernier des « cinq bons empereurs ». Qui lui succède ?",
     ("Commode", "Septime Sévère", "Caracalla", "Hadrien"),
     ["philosophie", "marc-aurele"], "Q1410", 0.96, 0.92, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("stoic-sage-ideal", "stoic-ethics", "stoicisme", "medium",
     "Comment appelle-t-on l'homme parfait selon les stoïciens ?",
     ("Le sage", "Le surhomme", "Le héros", "L'élu"),
     ["philosophie", "stoicisme"], "Q171315", 0.97, 0.94, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("chrysippus-second-founder", "stoicism-history", "stoicisme", "expert",
     "Quel philosophe est parfois surnommé le « second fondateur » du stoïcisme ?",
     ("Chrysippe", "Cléanthès", "Posidonius", "Panétius"),
     ["philosophie", "stoicisme"], "Q171315", 0.95, 0.90, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("stoic-three-parts-of-philosophy", "stoicism-doctrine", "stoicisme", "expert",
     "Quelles sont les trois parties de la philosophie stoïcienne ?",
     ("La logique, la physique et l'éthique", "La rhétorique, la grammaire et la poétique", "L'arithmétique, la géométrie et la musique", "La métaphysique, la théologie et l'astronomie"),
     ["philosophie", "stoicisme"], "Q171315", 0.95, 0.90, CAT, "philosophie/philosophie-stoicisme-001.json"),

    ("cleanthes-hymn-to-zeus", "stoicism-history", "stoicisme", "expert",
     "Quel stoïcien, successeur de Zénon, compose un Hymne à Zeus ?",
     ("Cléanthès", "Chrysippe", "Sénèque", "Épictète"),
     ["philosophie", "stoicisme"], "Q171315", 0.95, 0.90, CAT, "philosophie/philosophie-stoicisme-001.json"),
]
