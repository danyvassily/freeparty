/**
 * Free Party — Génération de questions par DeepSeek (côté serveur uniquement)
 *
 * La clé DEEPSEEK_API_KEY vit dans .env.local (jamais commitée, jamais
 * exposée au navigateur — aucun préfixe NEXT_PUBLIC_).
 *
 * Pipeline anti « mauvaise réponse » :
 *   1. Prompt strict (faits établis, une seule réponse possible, distracteurs
 *      clairement faux, explication obligatoire)
 *   2. Validation Zod du schéma Question (réponses uniques, index valide, etc.)
 *   3. Passe de vérification : le modèle relit chaque question et signale
 *      celles dont la réponse indiquée est fausse ou ambiguë → éliminées
 *   4. L'appelant retombe sur le catalogue local si le lot est insuffisant
 */
import { QuestionSchema, type Question, type QuestionCategory } from "./schema";
import { CATEGORY_LABELS } from "@/lib/game/modes";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const TIMEOUT_MS = 60_000;

export function isDeepSeekEnabled(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

interface AiRawQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
  explanation?: string;
  subcategory?: string;
  difficulty?: "easy" | "medium" | "hard";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function callDeepSeek(system: string, user: string): Promise<string> {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`DeepSeek HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Réponse DeepSeek vide");
  return content;
}

const GEN_SYSTEM = `Tu es un rédacteur de quiz professionnel francophone, reconnu pour ta rigueur factuelle.

RÈGLES ABSOLUES :
- Chaque question porte sur un fait ÉTABLI et VÉRIFIABLE (pas d'opinion, pas de "meilleur/pire", pas de chiffre qui change vite).
- UNE SEULE réponse correcte possible, sans la moindre ambiguïté.
- Les 3 distracteurs sont plausibles mais CLAIREMENT faux.
- Pas de questions datées ("récemment", "cette année", "actuellement") ni de records sportifs récents.
- La question ne contient JAMAIS sa propre réponse.
- Chaque question a une explication courte (1 phrase) confirmant le fait.
- Varie les sujets : pas deux questions sur le même fait ni le même sous-thème.
- Réponds UNIQUEMENT en JSON : {"questions":[{"question":"...","answers":["...","...","...","..."],"correctIndex":0,"explanation":"...","subcategory":"...","difficulty":"easy|medium|hard"}]}
- answers contient exactement 4 chaînes distinctes ; correctIndex (0-3) pointe la bonne réponse ; varie la position de la bonne réponse.`;

/**
 * Passe de vérification : le modèle relit le lot et renvoie les indices des
 * questions dont la réponse indiquée est FAUSSE ou AMBIGUË.
 */
async function verifyBatch(raw: AiRawQuestion[]): Promise<Set<number>> {
  if (raw.length === 0) return new Set();
  const listing = raw
    .map(
      (q, i) =>
        `#${i} Q: ${q.question} | Réponses: ${q.answers.join(" / ")} | Réponse indiquée: ${q.answers[q.correctIndex]}`,
    )
    .join("\n");
  try {
    const content = await callDeepSeek(
      `Tu es un vérificateur factuel impitoyable. Pour chaque question de quiz, vérifie que la "réponse indiquée" est la SEULE correcte et que le fait est établi. Réponds UNIQUEMENT en JSON : {"bad":[indices des questions fausses ou ambiguës]}. Si tout est correct : {"bad":[]}`,
      listing,
    );
    const parsed = JSON.parse(content) as { bad?: number[] };
    return new Set((parsed.bad ?? []).filter((n) => Number.isInteger(n)));
  } catch {
    // La vérification échoue → on ne filtre rien (le schéma Zod protège déjà)
    return new Set();
  }
}

/**
 * Génère `count` questions validées pour une catégorie (ou toutes si "mixed").
 * Retourne [] en cas d'échec — l'appelant bascule sur le catalogue local.
 */
export async function generateQuestionsWithDeepSeek(
  count: number,
  category: QuestionCategory | "mixed",
): Promise<Question[]> {
  if (!isDeepSeekEnabled()) return [];

  const theme =
    category === "mixed"
      ? `un mélange équilibré de ces thèmes : ${Object.values(CATEGORY_LABELS).join(", ")}`
      : `le thème « ${CATEGORY_LABELS[category] ?? category} »`;

  let raw: AiRawQuestion[] = [];
  try {
    const content = await callDeepSeek(
      GEN_SYSTEM,
      `Génère ${count} questions de quiz en français sur ${theme}. Répartis les difficultés (environ 1/3 easy, 1/2 medium, le reste hard).`,
    );
    const parsed = JSON.parse(content) as { questions?: AiRawQuestion[] };
    raw = Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch (e) {
    console.error("[deepseek] génération échouée:", e);
    return [];
  }

  // Passe de vérification factuelle
  const bad = await verifyBatch(raw);
  const kept = raw.filter((_, i) => !bad.has(i));

  // Mapping vers le schéma Question complet + validation Zod
  const stamp = Date.now().toString(36);
  const valid: Question[] = [];
  for (const [i, q] of kept.entries()) {
    const slug = slugify(q.question ?? "");
    if (!slug) continue;
    const candidate = {
      id: `ai-${stamp}-${i}-${slug.slice(0, 24)}`,
      conceptId: `ai-${slug}`,
      familyId: `ai-${slug}`,
      type: "mcq",
      inputMode: "mcq",
      question: q.question,
      answers: q.answers,
      correctAnswer: q.correctIndex,
      category: category === "mixed" ? "culture-generale" : category,
      subcategory: (q.subcategory ?? "général").slice(0, 60),
      difficulty: q.difficulty ?? "medium",
      language: "fr",
      tags: ["ia"],
      source: { provider: "deepseek", license: "AI-generated" },
      explanation: q.explanation?.slice(0, 300),
      confidence: 0.9,
      qualityScore: 0.9,
    };
    const result = QuestionSchema.safeParse(candidate);
    if (result.success) valid.push(result.data);
  }
  return valid;
}
