/** Un délai expiré (-1) n'est jamais une réponse, même en Vrai/Faux. */
export function isQuizAnswerCorrect(selected: number | null, correctAnswer: number, assertionIsTrue?: boolean): boolean {
  if (selected === null || !Number.isInteger(selected) || selected < 0) return false;
  if (assertionIsTrue !== undefined) return selected === (assertionIsTrue ? 0 : 1);
  return selected === correctAnswer;
}

/** Le chronomètre appelle les effets hors des fonctions de mise à jour React. */
export function startQuestionCountdown(seconds: number, onTick: (remaining: number) => void, onExpire: () => void): () => void {
  const deadline = Date.now() + seconds * 1000;
  const timer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    onTick(remaining);
    if (remaining === 0) {
      clearInterval(timer);
      onExpire();
    }
  }, 1000);
  return () => clearInterval(timer);
}

export function playerQuestionCount(total: number, playerIndex: number, players: number): number {
  return Math.max(0, Math.ceil((total - playerIndex) / players));
}
