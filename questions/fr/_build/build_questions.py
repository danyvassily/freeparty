#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Générateur des datasets de questions Free Party (modules grec, égyptien, philosophie).

Chaque question est définie comme tuple :
(conceptId, familyId, subcategory, difficulty, question_fr, (bonne_reponse, d1, d2, d3), tags, sourceQ, confidence, qualityScore)

La bonne réponse est TOUJOURS en première position du tuple ; le builder la place
à une position variable (correctAnswer varie) pour éviter les patterns.
"""
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # .../questions
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from greek1 import QUESTIONS as GREEK1
from greek2 import QUESTIONS as GREEK2
from egypt1 import QUESTIONS as EGYPT1
from egypt2 import QUESTIONS as EGYPT2
from philo1 import QUESTIONS as PHILO1
from philo2 import QUESTIONS as PHILO2

ALL = GREEK1 + GREEK2 + EGYPT1 + EGYPT2 + PHILO1 + PHILO2

PREFIX = {
    "mythologie-grecque": "greek-",
    "mythologie-egyptienne": "egyptian-",
    "philosophie": "phil-",
}

KABOB = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

def build2():
    files = {}
    counter = 0
    seen_ids = set()
    for entry in ALL:
        (concept, family, sub, diff, text, answers, tags, src, conf, qs, category, filename) = entry
        assert KABOB.match(concept), f"conceptId invalide: {concept}"
        assert KABOB.match(family), f"familyId invalide: {family}"
        assert KABOB.match(sub), f"subcategory invalide: {sub}"
        assert diff in ("easy", "medium", "hard", "expert"), f"difficulty invalide: {diff}"
        assert len(answers) == 4, f"4 réponses requises: {concept}"
        assert len(set(answers)) == 4, f"réponses dupliquées: {concept}"
        qid = PREFIX[category] + concept
        assert qid not in seen_ids, f"id dupliqué: {qid}"
        seen_ids.add(qid)
        # position variable de la bonne réponse
        pos = counter % 4
        ordered = [answers[pos]] + [a for i, a in enumerate(answers) if i != pos]
        q = {
            "id": qid,
            "conceptId": concept,
            "familyId": family,
            "type": "mcq",
            "question": text,
            "answers": list(ordered),
            "correctAnswer": 0,
            "category": category,
            "subcategory": sub,
            "difficulty": diff,
            "language": "fr",
            "tags": tags,
            "source": {
                "provider": "wikidata",
                "sourceId": src,
                "url": f"https://www.wikidata.org/wiki/{src}",
                "license": "CC0",
            },
            "verification": {
                "status": "verified",
                "verifiedAt": "2026-08-15",
                "sources": ["wikidata"],
            },
            "confidence": conf,
            "qualityScore": qs,
            "version": 1,
        }
        files.setdefault(filename, []).append(q)
        counter += 1
    return files, counter

def main():
    files, total = build2()
    for fname, qs in files.items():
        path = os.path.join(BASE, "fr", fname)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(qs, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{fname}: {len(qs)} questions -> {path}")
    print(f"TOTAL: {total} questions")

if __name__ == "__main__":
    main()
