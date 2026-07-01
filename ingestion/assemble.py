#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Merge structured JSON fragments (questions/formulas) into one validated
dataset.json for the app. Fails loudly on any integrity violation.

Usage: assemble.py <out.json> <fragment1.json> [fragment2.json ...]
Each fragment: {"questions": [...], "formulas": [...]} (either key optional).
"""
import json
import sys
from datetime import datetime, timezone
from lib import validate_dataset


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit("usage: assemble.py <out.json> <fragment.json> ...")
    out = sys.argv[1]
    questions: list = []
    formulas: list = []
    for path in sys.argv[2:]:
        with open(path, encoding="utf-8") as fh:
            frag = json.load(fh)
        questions.extend(frag.get("questions", []))
        formulas.extend(frag.get("formulas", []))

    dataset = {
        "isDemo": False,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceCount": len(sys.argv) - 2,
        "questions": questions,
        "formulas": formulas,
    }
    validate_dataset(dataset)  # raises on any problem
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(dataset, fh, ensure_ascii=False, indent=2)
    print(f"OK — {len(questions)} questions, {len(formulas)} formulas -> {out}")


if __name__ == "__main__":
    main()
