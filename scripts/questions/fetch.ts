/**
 * questions:fetch — récupère des faits depuis des sources externes (spec §18, §23–27).
 * Local-first : aucune dépendance réseau pendant une partie. Ce script est un
 * outil de développement qui alimente les datasets JSON avant validation.
 *
 * Adaptateurs prévus : WikidataAdapter, OpenTDBAdapter (voir QUESTION_ENGINE.md).
 * Le pipeline complet : fetch → generate → validate → verify → dedupe → review → import.
 */
import { logSection } from "./lib";

const MODE = process.argv[2] ?? "status";

const SOURCES = [
  {
    provider: "wikidata",
    url: "https://www.wikidata.org",
    license: "CC0",
    commercialUse: true,
    attributionRequired: false,
    enabled: true,
    lastLicenseCheck: "2026-08-15",
    note: "Source prioritaire (spec §23). Faits structurés, licence CC0.",
  },
  {
    provider: "opentdb",
    url: "https://opentdb.com",
    license: "CC BY-SA 4.0",
    commercialUse: false,
    attributionRequired: true,
    enabled: false,
    lastLicenseCheck: "2026-08-15",
    note: "Évalué (spec §25) : licence incompatible avec usage commercial → désactivé.",
  },
  {
    provider: "wikipedia",
    url: "https://fr.wikipedia.org",
    license: "CC BY-SA 4.0",
    commercialUse: false,
    attributionRequired: true,
    enabled: true,
    lastLicenseCheck: "2026-08-15",
    note: "Utilisé pour contexte et vérification, jamais pour copier une question (spec §24).",
  },
];

logSection("REGISTRE DES SOURCES (question_sources)");
for (const s of SOURCES) {
  console.log(
    `  ${s.provider.padEnd(10)} | commercial: ${s.commercialUse ? "oui" : "non"} | attribution: ${s.attributionRequired ? "oui" : "non"} | enabled: ${s.enabled}`,
  );
}

if (MODE === "opentdb") {
  logSection("OpenTDB — IMPORT DÉSACTIVÉ");
  console.log("Licence CC BY-SA 4.0 incompatible avec un usage commercial grand public.");
  console.log("Decision : OpenTDBAdapter existe mais reste désactivé (spec §25).");
  process.exit(0);
}

if (MODE === "wikidata") {
  logSection("Wikidata — requête SPARQL de démonstration (capitale des pays)");
  console.log("Exemple de requête utilisable via le Query Service (voir QUESTION_ENGINE.md) :");
  console.log(`
SELECT ?country ?countryLabel ?capitalLabel WHERE {
  ?country wdt:P31 wd:Q6256;          # pays souverain
           wdt:P36 ?capital.           # capitale
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
} LIMIT 10`);
  console.log("\nAucune donnée n'est écrite : exécutez `npm run questions:generate` pour les datasets embarqués.");
  process.exit(0);
}

console.log("\nAstuce : `npm run questions:fetch wikidata` ou `npm run questions:fetch opentdb`.");
