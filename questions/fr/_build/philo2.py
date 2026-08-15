# -*- coding: utf-8 -*-
"""Questions PHILOSOPHIE — philosophie moderne (Descartes, Spinoza, empiristes, Pascal, Leibniz, Kant, Hegel, Nietzsche, Kierkegaard, Marx, politique) et contemporaine (Sartre, Camus, Beauvoir, Arendt, Rawls, Foucault, phénoménologie, Wittgenstein, Popper, Kuhn...)."""
CAT = "philosophie"

QUESTIONS = [
    # ---------------- PHILOSOPHIE MODERNE (34) ----------------
    ("descartes-cogito-ergo-sum", "cartesian-cogito", "philosophie-moderne", "easy",
     "Quel philosophe a formulé « Je pense, donc je suis » ?",
     ("Descartes", "Spinoza", "Kant", "Pascal"),
     ["philosophie", "descartes"], "Q9191", 0.98, 0.95, CAT, "philosophie/philosophie-moderne-001.json"),

    ("descartes-discourse-on-method-1637", "cartesian-works", "philosophie-moderne", "medium",
     "En quelle année Descartes publie-t-il le Discours de la méthode ?",
     ("1637", "1610", "1650", "1715"),
     ["philosophie", "descartes"], "Q9191", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("descartes-methodical-doubt", "cartesian-method", "philosophie-moderne", "medium",
     "Quelle méthode Descartes adopte-t-il pour fonder la connaissance ?",
     ("Le doute méthodique", "L'observation empirique", "L'intuition mystique", "L'autorité des Anciens"),
     ["philosophie", "descartes"], "Q9191", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("descartes-dualism-soul-body", "cartesian-metaphysics", "philosophie-moderne", "hard",
     "Quelle opposition structure la métaphysique de Descartes ?",
     ("L'âme (pensée) et le corps (étendue)", "Le bien et le mal", "L'être et le paraître", "Le fini et l'infini"),
     ["philosophie", "descartes"], "Q9191", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("descartes-meditations-metaphysiques", "cartesian-works", "philosophie-moderne", "medium",
     "Quel ouvrage de Descartes contient la démonstration de l'existence de Dieu et de l'immortalité de l'âme ?",
     ("Les Méditations métaphysiques", "Le Discours de la méthode", "Les Passions de l'âme", "Le Traité du monde"),
     ["philosophie", "descartes"], "Q9191", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("spinoza-ethics-geometric-method", "spinozist-method", "philosophie-moderne", "medium",
     "À la manière de quelle science Spinoza rédige-t-il son Éthique ?",
     ("La géométrie", "La médecine", "La théologie", "La grammaire"),
     ["philosophie", "spinoza"], "Q35852", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("spinoza-deus-sive-natura", "spinozist-metaphysics", "philosophie-moderne", "hard",
     "Quelle formule célèbre résume le panthéisme de Spinoza ?",
     ("« Dieu, c'est-à-dire la Nature »", "« Dieu est mort »", "« Dieu est amour »", "« Dieu joue aux dés »"),
     ["philosophie", "spinoza"], "Q35852", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("spinoza-excommunicated-amsterdam", "spinoza-biography", "philosophie-moderne", "hard",
     "Quelle communauté exclut Spinoza en 1656 ?",
     ("La communauté juive d'Amsterdam", "L'Église catholique de Rome", "Les calvinistes de Leyde", "Les jésuites de Paris"),
     ["philosophie", "spinoza"], "Q35852", 0.97, 0.93, CAT, "philosophie/philosophie-moderne-001.json"),

    ("locke-tabula-rasa", "british-empiricism", "philosophie-moderne", "medium",
     "Quel philosophe compare l'esprit humain à une table rase ?",
     ("Locke", "Descartes", "Leibniz", "Kant"),
     ["philosophie", "empirisme"], "Q9353", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("berkeley-esse-est-percipi", "british-empiricism", "philosophie-moderne", "hard",
     "Quel philosophe affirme qu'« être, c'est être perçu » ?",
     ("Berkeley", "Hume", "Locke", "Bacon"),
     ["philosophie", "empirisme"], "Q82067", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("hume-problem-of-induction", "hume-epistemology", "philosophie-moderne", "hard",
     "Quel philosophe montre que l'induction ne peut être rationnellement justifiée ?",
     ("Hume", "Bacon", "Descartes", "Leibniz"),
     ["philosophie", "empirisme"], "Q37160", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("pascal-the-wager", "pascal-philosophy", "philosophie-moderne", "medium",
     "Quel argument célèbre Pascal propose-t-il en faveur de la croyance en Dieu ?",
     ("Le pari", "La preuve ontologique", "L'argument cosmologique", "La preuve par les miracles"),
     ["philosophie", "pascal"], "Q1290", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("leibniz-monads", "leibniz-metaphysics", "philosophie-moderne", "hard",
     "Quels sont les éléments simples et indivisibles de la métaphysique de Leibniz ?",
     ("Les monades", "Les atomes", "Les idées innées", "Les particules"),
     ["philosophie", "leibniz"], "Q9047", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("kant-critique-of-pure-reason", "kantian-criticism", "philosophie-moderne", "easy",
     "Quel est l'ouvrage principal de Kant ?",
     ("La Critique de la raison pure", "Le Discours de la méthode", "L'Éthique", "Le Léviathan"),
     ["philosophie", "kant"], "Q9312", 0.98, 0.95, CAT, "philosophie/philosophie-moderne-001.json"),

    ("kant-categorical-imperative", "kantian-ethics", "philosophie-moderne", "medium",
     "Comment s'appelle le principe moral fondamental de Kant ?",
     ("L'impératif catégorique", "La règle d'or", "Le principe d'utilité", "Le juste milieu"),
     ["philosophie", "kant"], "Q9312", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("kant-copernican-revolution", "kantian-epistemology", "philosophie-moderne", "hard",
     "Comment Kant qualifie-t-il son changement de perspective en philosophie ?",
     ("Une révolution copernicienne", "Une table rase", "Un retour aux choses mêmes", "Une conversion morale"),
     ["philosophie", "kant"], "Q9312", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("kant-sapere-aude", "kantian-enlightenment", "philosophie-moderne", "hard",
     "Quelle devise Kant donne-t-il aux Lumières ?",
     ("« Sapere aude » : ose te servir de ton propre entendement", "« Carpe diem »", "« Connais-toi toi-même »", "« Rien de trop »"),
     ["philosophie", "kant"], "Q9312", 0.97, 0.93, CAT, "philosophie/philosophie-moderne-001.json"),

    ("hegel-phenomenology-of-spirit", "hegelian-works", "philosophie-moderne", "medium",
     "Quel philosophe allemand écrit la Phénoménologie de l'esprit ?",
     ("Hegel", "Kant", "Schopenhauer", "Fichte"),
     ["philosophie", "hegel"], "Q9235", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("hegel-dialectical-method", "hegelian-method", "philosophie-moderne", "hard",
     "Quelle méthode caractérise la philosophie de Hegel ?",
     ("La dialectique", "L'analyse linguistique", "L'introspection", "La déduction mathématique"),
     ["philosophie", "hegel"], "Q9235", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("hegel-master-slave-dialectic", "hegelian-dialectic", "philosophie-moderne", "hard",
     "Quelle célèbre figure de la Phénoménologie de l'esprit décrit la lutte de deux consciences ?",
     ("La dialectique du maître et de l'esclave", "L'allégorie de la caverne", "Le mythe de la caverne", "Le pari de Pascal"),
     ["philosophie", "hegel"], "Q9235", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("nietzsche-god-is-dead", "nietzschean-critique", "philosophie-moderne", "medium",
     "Quelle annonce célèbre Nietzsche place dans la bouche de l'insensé ?",
     ("« Dieu est mort »", "« L'homme est né libre »", "« Je pense donc je suis »", "« Tout est nombre »"),
     ["philosophie", "nietzsche"], "Q9358", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("nietzsche-zarathustra-overman", "nietzschean-doctrine", "philosophie-moderne", "medium",
     "Quelle figure Nietzsche oppose-t-il au « dernier homme » ?",
     ("Le surhomme", "Le sage", "Le héros romantique", "L'ange"),
     ["philosophie", "nietzsche"], "Q9358", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("nietzsche-will-to-power", "nietzschean-doctrine", "philosophie-moderne", "hard",
     "Quel concept central de Nietzsche désigne la force fondamentale qui anime tout vivant ?",
     ("La volonté de puissance", "La volonté de vivre", "Le conatus", "L'élan vital"),
     ["philosophie", "nietzsche"], "Q9358", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("nietzsche-genealogy-of-morals", "nietzschean-works", "philosophie-moderne", "hard",
     "Quel ouvrage de Nietzsche entreprend la critique généalogique de la morale ?",
     ("La Généalogie de la morale", "Le Capital", "La Critique de la raison pure", "Les Pensées"),
     ["philosophie", "nietzsche"], "Q9358", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("kierkegaard-either-or", "kierkegaardian-works", "philosophie-moderne", "medium",
     "Quel philosophe danois écrit Ou bien... ou bien ?",
     ("Kierkegaard", "Hegel", "Nietzsche", "Schopenhauer"),
     ["philosophie", "kierkegaard"], "Q6512", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("kierkegaard-three-stages-of-existence", "kierkegaardian-doctrine", "philosophie-moderne", "hard",
     "Quels sont les trois stades de l'existence selon Kierkegaard ?",
     ("Esthétique, éthique, religieux", "Sensible, intelligible, divin", "Enfance, jeunesse, vieillesse", "Corps, âme, esprit"),
     ["philosophie", "kierkegaard"], "Q6512", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("kierkegaard-fear-and-trembling", "kierkegaardian-works", "philosophie-moderne", "hard",
     "Quel ouvrage de Kierkegaard médite sur le sacrifice d'Abraham ?",
     ("Crainte et tremblement", "Le Mythe de Sisyphe", "La Nausée", "Le Gai Savoir"),
     ["philosophie", "kierkegaard"], "Q6512", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("marx-das-kapital", "marxian-works", "philosophie-moderne", "easy",
     "Quel est le grand ouvrage économique de Karl Marx ?",
     ("Le Capital", "La Richesse des nations", "L'Éthique", "Le Léviathan"),
     ["philosophie", "marx"], "Q9061", 0.98, 0.95, CAT, "philosophie/philosophie-moderne-001.json"),

    ("marx-class-struggle", "marxian-doctrine", "philosophie-moderne", "medium",
     "Selon Marx, quelle est la clé de l'histoire des sociétés humaines ?",
     ("La lutte des classes", "La volonté de puissance", "La lutte pour la reconnaissance", "La sélection naturelle"),
     ["philosophie", "marx"], "Q9061", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("marx-surplus-value", "marxian-economics", "philosophie-moderne", "hard",
     "Comment Marx appelle-t-il la valeur extraite du travail des ouvriers par les capitalistes ?",
     ("La plus-value", "Le profit net", "La rente", "L'intérêt"),
     ["philosophie", "marx"], "Q9061", 0.96, 0.92, CAT, "philosophie/philosophie-moderne-001.json"),

    ("hobbes-leviathan-state-of-nature", "hobbesian-politics", "philosophie-moderne", "medium",
     "Quel philosophe décrit l'état de nature comme une guerre de tous contre tous ?",
     ("Hobbes", "Locke", "Rousseau", "Montesquieu"),
     ["philosophie", "politique"], "Q35840", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    ("rousseau-social-contract", "rousseauian-politics", "philosophie-moderne", "easy",
     "Qui écrit Du contrat social en 1762 ?",
     ("Rousseau", "Voltaire", "Diderot", "Montesquieu"),
     ["philosophie", "politique"], "Q9142", 0.98, 0.95, CAT, "philosophie/philosophie-moderne-001.json"),

    ("machiavelli-the-prince", "machiavellian-politics", "philosophie-moderne", "easy",
     "Quel penseur politique italien écrit Le Prince ?",
     ("Machiavel", "Guichardin", "Castiglione", "Botero"),
     ["philosophie", "politique"], "Q1393", 0.98, 0.95, CAT, "philosophie/philosophie-moderne-001.json"),

    ("montesquieu-separation-of-powers", "montesquieuian-politics", "philosophie-moderne", "medium",
     "Quel philosophe des Lumières théorise la séparation des trois pouvoirs ?",
     ("Montesquieu", "Voltaire", "Rousseau", "Diderot"),
     ["philosophie", "politique"], "Q9337", 0.97, 0.94, CAT, "philosophie/philosophie-moderne-001.json"),

    # ---------------- PHILOSOPHIE CONTEMPORAINE (30) ----------------
    ("sartre-existence-precedes-essence", "sartrean-existentialism", "existentialisme", "easy",
     "Quelle formule résume la philosophie de Sartre ?",
     ("« L'existence précède l'essence »", "« L'essence précède l'existence »", "« Dieu est mort »", "« Tout est nombre »"),
     ["philosophie", "sartre"], "Q9364", 0.98, 0.95, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("sartre-being-and-nothingness", "sartrean-works", "existentialisme", "medium",
     "Quel est le grand traité philosophique de Jean-Paul Sartre ?",
     ("L'Être et le Néant", "La Phénoménologie de l'esprit", "L'Évolution créatrice", "Le Hasard et la Nécessité"),
     ["philosophie", "sartre"], "Q9364", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("sartre-hell-is-other-people", "sartrean-works", "existentialisme", "medium",
     "Dans quelle pièce de Sartre lit-on « L'enfer, c'est les autres » ?",
     ("Huis clos", "Les Mouches", "Les Mains sales", "Le Diable et le Bon Dieu"),
     ["philosophie", "sartre"], "Q9364", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("sartre-bad-faith", "sartrean-doctrine", "existentialisme", "hard",
     "Comment Sartre appelle-t-il le mensonge que l'on se fait à soi-même pour fuir sa liberté ?",
     ("La mauvaise foi", "Le refoulement", "La dissonance", "L'aliénation"),
     ["philosophie", "sartre"], "Q9364", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("sartre-refused-nobel-prize", "sartre-biography", "existentialisme", "hard",
     "Quel prix Sartre refuse-t-il en 1964 ?",
     ("Le prix Nobel de littérature", "Le prix Goncourt", "Le prix Pulitzer", "Le prix Goethe"),
     ["philosophie", "sartre"], "Q9364", 0.97, 0.93, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("camus-the-stranger", "camusian-works", "existentialisme", "easy",
     "Quel roman de Camus s'ouvre sur la mort de la mère du narrateur ?",
     ("L'Étranger", "La Peste", "La Chute", "L'Exil et le Royaume"),
     ["philosophie", "camus"], "Q784", 0.98, 0.95, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("camus-myth-of-sisyphus-absurd", "camusian-absurd", "existentialisme", "medium",
     "Dans quel essai Camus développe-t-il la notion d'absurde ?",
     ("Le Mythe de Sisyphe", "L'Homme révolté", "L'Actuel", "Le Mythe de Prométhée"),
     ["philosophie", "camus"], "Q784", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("camus-sisyphus-happy", "camusian-absurd", "existentialisme", "hard",
     "Quelle phrase célèbre conclut Le Mythe de Sisyphe ?",
     ("« Il faut imaginer Sisyphe heureux »", "« Il faut cultiver notre jardin »", "« L'enfer, c'est les autres »", "« Je pense donc je suis »"),
     ["philosophie", "camus"], "Q784", 0.97, 0.93, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("camus-the-plague-oran", "camusian-works", "existentialisme", "medium",
     "Quel roman de Camus met en scène la ville d'Oran frappée par une épidémie ?",
     ("La Peste", "La Chute", "L'Étranger", "Le Premier Homme"),
     ["philosophie", "camus"], "Q784", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("beauvoir-the-second-sex", "beauvoirian-works", "existentialisme", "easy",
     "Quel est l'essai fondamental de Simone de Beauvoir sur la condition féminine ?",
     ("Le Deuxième Sexe", "La Femme rompue", "Les Belles Images", "Mémoires d'une jeune fille rangée"),
     ["philosophie", "beauvoir"], "Q7197", 0.98, 0.95, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("beauvoir-one-is-not-born-a-woman", "beauvoirian-doctrine", "existentialisme", "medium",
     "Quelle phrase célèbre de Beauvoir résume sa thèse sur le genre ?",
     ("« On ne naît pas femme, on le devient »", "« La femme est un mythe »", "« Le privé est politique »", "« Femme, réveille-toi »"),
     ["philosophie", "beauvoir"], "Q7197", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("beauvoir-mandarins-goncourt", "beauvoir-biography", "existentialisme", "hard",
     "Quel roman de Beauvoir reçoit le prix Goncourt en 1954 ?",
     ("Les Mandarins", "L'Invitée", "La Force de l'âge", "Tous les hommes sont mortels"),
     ["philosophie", "beauvoir"], "Q7197", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("arendt-banality-of-evil", "arendtian-political", "philosophie-contemporaine", "medium",
     "Quelle expression Hannah Arendt emploie-t-elle à propos du mal commis par Eichmann ?",
     ("La banalité du mal", "Le mal radical", "La faute tragique", "Le péché originel"),
     ["philosophie", "arendt"], "Q60025", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("arendt-labor-work-action", "arendtian-political", "philosophie-contemporaine", "hard",
     "Dans Condition de l'homme moderne, quelles sont les trois activités fondamentales ?",
     ("Le travail, l'œuvre et l'action", "L'amour, le jeu et la prière", "La production, la consommation et l'échange", "La guerre, le commerce et la science"),
     ["philosophie", "arendt"], "Q60025", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("arendt-origins-of-totalitarianism", "arendtian-works", "philosophie-contemporaine", "medium",
     "Quel ouvrage d'Hannah Arendt analyse le nazisme et le stalinisme ?",
     ("Les Origines du totalitarisme", "La Société ouverte et ses ennemis", "L'Ancien Régime et la Révolution", "Le Capital"),
     ["philosophie", "arendt"], "Q60025", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("rawls-theory-of-justice-1971", "rawlsian-justice", "philosophie-contemporaine", "medium",
     "Quel philosophe américain écrit Théorie de la justice en 1971 ?",
     ("John Rawls", "Robert Nozick", "Michael Sandel", "Richard Rorty"),
     ["philosophie", "rawls"], "Q172790", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("rawls-veil-of-ignorance", "rawlsian-justice", "philosophie-contemporaine", "hard",
     "Quel dispositif Rawls imagine-t-il pour garantir l'impartialité des principes de justice ?",
     ("Le voile d'ignorance", "La main invisible", "La règle d'or", "Le panoptique"),
     ["philosophie", "rawls"], "Q172790", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("foucault-discipline-and-punish", "foucauldian-power", "philosophie-contemporaine", "medium",
     "Quel ouvrage de Foucault étudie la naissance de la prison ?",
     ("Surveiller et punir", "L'Histoire de la folie", "Les Mots et les Choses", "La Volonté de savoir"),
     ["philosophie", "foucault"], "Q44272", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("foucault-words-and-things-meninas", "foucauldian-works", "philosophie-contemporaine", "hard",
     "Quel ouvrage de Foucault s'ouvre sur l'analyse du tableau Les Ménines de Vélasquez ?",
     ("Les Mots et les Choses", "L'Archéologie du savoir", "L'Ordre du discours", "La Naissance de la clinique"),
     ["philosophie", "foucault"], "Q44272", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("foucault-biopower", "foucauldian-power", "philosophie-contemporaine", "hard",
     "Comment Foucault nomme-t-il le pouvoir qui s'exerce sur la vie des populations ?",
     ("Le biopouvoir", "Le pouvoir spirituel", "La souveraineté", "L'hégémonie"),
     ["philosophie", "foucault"], "Q44272", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("husserl-founder-of-phenomenology", "phenomenological-movement", "philosophie-contemporaine", "medium",
     "Quel philosophe est considéré comme le fondateur de la phénoménologie ?",
     ("Husserl", "Heidegger", "Merleau-Ponty", "Bergson"),
     ["philosophie", "phenomenologie"], "Q48483", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("heidegger-being-and-time", "heideggerian-existentialism", "existentialisme", "medium",
     "Quel est l'ouvrage majeur de Martin Heidegger ?",
     ("Être et temps", "L'Être et le Néant", "La Nausée", "Le Rire"),
     ["philosophie", "heidegger"], "Q48301", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("intentionality-consciousness-of-something", "phenomenological-movement", "philosophie-contemporaine", "hard",
     "Quelle thèse phénoménologique énonce que « toute conscience est conscience de quelque chose » ?",
     ("L'intentionnalité", "La réflexivité", "L'introspection", "La transparence"),
     ["philosophie", "phenomenologie"], "Q48483", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("bergson-elan-vital", "bergsonian-philosophy", "philosophie-contemporaine", "medium",
     "Quel philosophe français développe la notion d'élan vital ?",
     ("Bergson", "Comte", "Taine", "Renan"),
     ["philosophie", "bergson"], "Q212724", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("wittgenstein-tractatus-final-proposition", "wittgensteinian-philosophy", "philosophie-contemporaine", "hard",
     "Quelle formule conclut le Tractatus logico-philosophicus ?",
     ("« Ce dont on ne peut parler, il faut le taire »", "« Dieu est mort »", "« Tout est nombre »", "« L'existence précède l'essence »"),
     ["philosophie", "wittgenstein"], "Q9391", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("wittgenstein-meaning-is-use", "wittgensteinian-philosophy", "philosophie-contemporaine", "expert",
     "Dans ses Recherches philosophiques, que devient la signification d'un mot ?",
     ("Son usage dans le langage", "Sa définition dans le dictionnaire", "Son étymologie", "Sa sonorité"),
     ["philosophie", "wittgenstein"], "Q9391", 0.95, 0.90, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("popper-falsifiability-criterion", "popperian-epistemology", "epistemologie", "medium",
     "Quel critère Popper propose-t-il pour distinguer science et non-science ?",
     ("La falsifiabilité", "La vérifiabilité", "L'évidence", "Le consensus"),
     ["philosophie", "popper"], "Q81235", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("popper-open-society", "popperian-politics", "philosophie-contemporaine", "hard",
     "Quel ouvrage de Popper critique les philosophies de Platon, Hegel et Marx ?",
     ("La Société ouverte et ses ennemis", "La Logique de la découverte scientifique", "Conjectures et Réfutations", "La Misère de l'historicisme"),
     ["philosophie", "popper"], "Q81235", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("kuhn-paradigms", "kuhnian-epistemology", "epistemologie", "medium",
     "Quel historien des sciences introduit la notion de paradigme ?",
     ("Thomas Kuhn", "Karl Popper", "Gaston Bachelard", "Alexandre Koyré"),
     ["philosophie", "kuhn"], "Q184527", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("comte-law-of-three-stages", "comtean-positivism", "philosophie-contemporaine", "medium",
     "Quelle « loi » Auguste Comte propose-t-il pour l'histoire de l'esprit humain ?",
     ("La loi des trois états", "La loi de la gravitation", "La loi des rendements décroissants", "La loi de la sélection naturelle"),
     ["philosophie", "comte"], "Q12718", 0.96, 0.92, CAT, "philosophie/philosophie-contemporaine-001.json"),

    ("freud-interpretation-of-dreams", "freudian-culture", "philosophie-contemporaine", "medium",
     "Quel ouvrage de Freud fonde la psychanalyse en 1900 ?",
     ("L'Interprétation des rêves", "Le Malaise dans la culture", "Totem et tabou", "L'Avenir d'une illusion"),
     ["philosophie", "freud"], "Q9215", 0.97, 0.94, CAT, "philosophie/philosophie-contemporaine-001.json"),
]
