"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Brain, Trophy } from "lucide-react";
import { useLanguageStore } from "@/lib/store/language";

const CHALLENGES = [
  ["Quelle est la suite : 2, 4, 8, 16, ?", "What comes next: 2, 4, 8, 16, ?", ["24", "32", "30", "36"], 1],
  ["Si tous les bloops sont des razzies et qu'aucun razzie n'est jaune, un bloop peut-il être jaune ?", "If all bloops are razzies and no razzie is yellow, can a bloop be yellow?", ["Oui / Yes", "Non / No", "Parfois / Sometimes", "Inconnu / Unknown"], 1],
  ["Quel nombre manque : 3, 6, 11, 18, ?", "Which number is missing: 3, 6, 11, 18, ?", ["25", "26", "27", "29"], 1],
  ["Un cube a 6 faces. Combien d'arêtes possède-t-il ?", "A cube has 6 faces. How many edges does it have?", ["8", "10", "12", "14"], 2],
  ["Quel mot est différent des autres ?", "Which word is different from the others?", ["Carré / Square", "Triangle", "Cercle / Circle", "Cube / Cube"], 3],
  ["Si A=1, B=2, combien vaut JOUXTA ?", "If A=1, B=2, what is JOUXTA?", ["75", "76", "77", "78"], 2],
  ["Un train met 2 h pour parcourir 120 km. Quelle est sa vitesse ?", "A train takes 2 hours to travel 120 km. What is its speed?", ["50 km/h", "60 km/h", "80 km/h", "120 km/h"], 1],
  ["Quel est l'intrus : 1, 3, 5, 8, 9 ?", "Which is the odd one out: 1, 3, 5, 8, 9?", ["1", "3", "8", "9"], 2],
] as const;

export function IQGame() {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.language);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const challenge = CHALLENGES[index];
  if (done) return <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center"><Trophy className="h-14 w-14 text-fp-yellow" /><h1 className="mt-5 text-3xl font-black text-fp-text">{score >= 7 ? (lang === "en" ? "Genius mode unlocked!" : "Mode génie débloqué !") : (lang === "en" ? "Keep training!" : "On s'entraîne encore !")}</h1><p className="mt-3 text-lg text-fp-text-dim">{score}/8 {lang === "en" ? "correct answers" : "bonnes réponses"}</p><button className="fp-btn-primary mt-7" onClick={() => router.push("/play/local")}>{lang === "en" ? "Back to games" : "Retour aux jeux"}</button></main>;
  return <main className="mx-auto min-h-dvh max-w-2xl px-4 py-8"><button onClick={() => router.push("/play/local")} className="fp-btn-ghost"><ChevronLeft className="h-4 w-4" />{lang === "en" ? "Quit" : "Quitter"}</button><div className="mt-8 text-center"><Brain className="mx-auto h-12 w-12 text-fp-primary" /><p className="mt-3 fp-eyebrow">QI Express · {index + 1}/8</p><h1 className="mt-2 text-2xl font-black text-fp-text">{lang === "en" ? challenge[1] : challenge[0]}</h1></div><div className="mt-8 grid gap-3">{challenge[2].map((answer, i) => <button key={answer} onClick={() => { setScore((s) => s + (i === challenge[3] ? 1 : 0)); if (index === CHALLENGES.length - 1) setDone(true); else setIndex((n) => n + 1); }} className="fp-card p-4 text-left font-semibold hover:border-fp-primary/50">{String.fromCharCode(65 + i)}. {answer}</button>)}</div></main>;
}
