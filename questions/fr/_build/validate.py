#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validation des 3 modules Free Party (grec, égyptien, philosophie)."""
import json, os, re, sys
from collections import Counter

BASE = "/Users/danyvassily/Documents/dev/freeparty/questions/fr"
ROOTS = ["mythologie-grecque", "mythologie-egyptienne", "philosophie"]
REQUIRED = {"id","conceptId","familyId","type","question","answers","correctAnswer","category","subcategory","difficulty","language","tags","source","verification","confidence","qualityScore","version"}
KABOB = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
errors, warnings = [], []
ids, concepts = set(), {}
cats, diffs, positions, subs = Counter(), Counter(), Counter(), Counter()
total, nfiles = 0, 0

for root in ROOTS:
    d = os.path.join(BASE, root)
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".json"): continue
        path = os.path.join(d, fn); nfiles += 1
        data = json.load(open(path, encoding="utf-8"))
        for i, q in enumerate(data):
            total += 1
            missing = REQUIRED - set(q)
            if missing: errors.append(f"{fn} #{i}: clés manquantes {missing}")
            if q.get("type") != "mcq": errors.append(f"{fn} #{i}: type")
            if q.get("language") != "fr": errors.append(f"{fn} #{i}: language")
            if q.get("version") != 1: errors.append(f"{fn} #{i}: version")
            if q.get("category") != root: errors.append(f"{fn} #{i}: category")
            if q.get("difficulty") not in {"easy","medium","hard","expert"}: errors.append(f"{fn} #{i}: diff")
            qid = q.get("id")
            if qid in ids: errors.append(f"{fn} #{i}: id dupliqué {qid}")
            ids.add(qid)
            for k in ("id","conceptId","familyId","subcategory"):
                if not KABOB.match(str(q.get(k))): errors.append(f"{fn} #{i}: {k} {q.get(k)!r}")
            if q.get("conceptId") in concepts: warnings.append(f"conceptId réutilisé {q.get('conceptId')}")
            concepts[q.get("conceptId")] = qid
            ans = q.get("answers")
            if not isinstance(ans, list) or len(ans) != 4: errors.append(f"{fn} #{i}: answers")
            elif len(set(ans)) != 4: errors.append(f"{fn} #{i}: réponses dupliquées")
            ca = q.get("correctAnswer")
            if not isinstance(ca, int) or not 0 <= ca <= 3: errors.append(f"{fn} #{i}: correctAnswer")
            else: positions[ca] += 1
            if not str(q.get("question","")).strip().endswith("?"): errors.append(f"{fn} #{i}: pas de '?'")
            src = q.get("source") or {}
            if src.get("provider") != "wikidata" or not re.match(r"^Q\d+$", str(src.get("sourceId",""))):
                errors.append(f"{fn} #{i}: source {src}")
            verif = q.get("verification") or {}
            if verif.get("status") != "verified": errors.append(f"{fn} #{i}: verification")
            cats[q.get("category")] += 1
            diffs[q.get("difficulty")] += 1
            subs[(root, q.get("subcategory"))] += 1

print(f"FICHIERS: {nfiles} | TOTAL: {total}")
print("PAR CATÉGORIE:", dict(cats))
print("PAR DIFFICULTÉ:", dict(diffs))
print("  % easy+medium:", round(100*(diffs['easy']+diffs['medium'])/total), "%")
print("POSITIONS correctAnswer:", dict(sorted(positions.items())))
print("SOUS-CATÉGORIES:")
for (r, s), n in sorted(subs.items()):
    print(f"  {r:22s} {s:24s} {n}")
print(f"ERREURS: {len(errors)}"); [print(" ERR:", e) for e in errors[:40]]
print(f"WARNINGS: {len(warnings)}"); [print(" WARN:", w) for w in warnings[:20]]
sys.exit(1 if errors else 0)
