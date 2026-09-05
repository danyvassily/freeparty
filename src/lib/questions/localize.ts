/**
 * Free Party — Localisation des questions (FR/EN)
 * Chaque question porte ses traductions (champ `translations`). En ligne,
 * l'hôte pousse la question multilingue et CHAQUE joueur la voit dans sa
 * langue : un Français en français, un Anglophone en anglais — même question,
 * même index de bonne réponse (correctAnswer ne change jamais).
 * Repli : français si la traduction est absente ou incomplète.
 */

export interface LocalizableTranslation {
  question: string;
  answers?: string[];
  explanation?: string;
}

export interface LocalizableQuestion {
  question: string;
  answers: string[];
  language?: string;
  correctAnswer?: number;
  explanation?: string;
  translations?: Partial<Record<string, LocalizableTranslation>>;
}

export interface LocalizedQuestion {
  question: string;
  answers: string[];
  correctAnswer?: number;
  explanation?: string;
  /** Langue réellement affichée (peut être "fr" en repli) */
  lang: string;
}

/** Traductions de questions réellement disponibles aujourd'hui */
export const QUESTION_TRANSLATION_LANGS = ["en"] as const;

export function localizeQuestion(q: LocalizableQuestion, lang: string): LocalizedQuestion {
  const base = lang.toLowerCase().split("-")[0];
  const t = q.translations?.[base];
  if (t && t.question.trim().length >= 5 && t.answers && t.answers.length === q.answers.length) {
    return {
      question: t.question,
      answers: t.answers,
      correctAnswer: q.correctAnswer, // l'index est partagé entre langues
      explanation: t.explanation ?? q.explanation,
      lang: base,
    };
  }
  if (base !== "fr" && q.language === base) {
    return {
      question: q.question,
      answers: q.answers,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      lang: base,
    };
  }
  return {
    question: q.question,
    answers: q.answers,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    lang: "fr",
  };
}
