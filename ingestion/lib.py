# -*- coding: utf-8 -*-
"""Ingestion helpers: PDF text extraction + dataset validation.

The validation mirrors the app's TypeScript model and enforces the data-integrity
rules: official items must carry a source citation, AI items must not masquerade
as official, and answer indices must be in range.
"""
import base64
import json
import re
import fitz  # PyMuPDF

VALID_DOMAINS = {"quantitative", "verbal", "english", "writing"}
VALID_DIFF = {"easy", "medium", "hard"}

# --- RTL bracket repair -----------------------------------------------------
# A Hebrew parenthetical gloss captured in visual (right-to-left) order comes out
# with its brackets mirrored: "(שחצן)" is stored as ")שחצן(". Left uncorrected it
# renders backwards in the app. We repair ONLY strings that are "reversed-dominant"
# — where a ')' appears before any matching '(' (running depth goes negative). That
# never happens in correctly-stored text such as "(x−3) שווה (x+4)", so those are
# left untouched. Within a reversed string we flip only isolated ")X(" islands that
# do not span a line break, which keeps numbered list markers like "(1) … (2)" on
# separate lines intact.
_REVERSED_ISLAND = re.compile(r"\)([^()\n]+)\(")


def _is_reversed_dominant(s: str) -> bool:
    depth = 0
    for ch in s:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth < 0:
                return True
    return False


def fix_mirrored_parentheses(text: str) -> str:
    """Repair RTL-mirrored parenthetical brackets ')word(' -> '(word)'.

    Safe by construction: touches only reversed-dominant strings and only flips
    isolated ')…(' islands that stay on one line. Correctly-stored math such as
    '(x−3) שווה (x+4)' and multi-line numbered lists are left unchanged.
    """
    if not text or not _is_reversed_dominant(text):
        return text
    return _REVERSED_ISLAND.sub(r"(\1)", text)


def normalize_text_fields(dataset: dict) -> int:
    """Apply fix_mirrored_parentheses across every human-readable text field.

    Returns the number of fields changed. Run at assembly time so the shipped
    dataset never carries mirrored brackets, regardless of how a fragment was
    produced (PDF extraction, visual transcription, etc.).
    """
    n = 0

    def apply(obj: dict, key: str) -> None:
        nonlocal n
        v = obj.get(key)
        if isinstance(v, str):
            nv = fix_mirrored_parentheses(v)
            if nv != v:
                obj[key] = nv
                n += 1

    for q in dataset.get("questions", []):
        apply(q, "stem")
        choices = q.get("choices")
        if isinstance(choices, list):
            for i, c in enumerate(choices):
                if isinstance(c, str):
                    nc = fix_mirrored_parentheses(c)
                    if nc != c:
                        choices[i] = nc
                        n += 1
        expl = q.get("explanation")
        if isinstance(expl, dict):
            apply(expl, "text")
    for f in dataset.get("formulas", []):
        for k in ("name", "formula", "explanation", "example"):
            apply(f, k)
    return n


def extract_pages(pdf_bytes: bytes) -> list[str]:
    """Return per-page text. PyMuPDF yields Hebrew in correct logical order."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return [page.get_text("text") for page in doc]


def load_pdf_from_toolresult(path: str) -> tuple[str, bytes]:
    """Decode a PDF saved by the Drive MCP tool as JSON {content: base64, title}."""
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    return data.get("title", "?"), base64.b64decode(data["content"])


class ValidationError(Exception):
    pass


def validate_question(q: dict) -> None:
    for f in ("id", "origin", "domain", "topic", "stem", "choices", "correctIndex"):
        if f not in q:
            raise ValidationError(f"question missing field: {f}")
    if q["origin"] not in ("official", "ai"):
        raise ValidationError(f"bad origin: {q['origin']}")
    if q["domain"] not in VALID_DOMAINS:
        raise ValidationError(f"bad domain: {q['domain']}")
    if not isinstance(q["choices"], list) or len(q["choices"]) < 2:
        raise ValidationError("choices must be a list of >= 2")
    if not (0 <= q["correctIndex"] < len(q["choices"])):
        raise ValidationError("correctIndex out of range")
    if q["origin"] == "official" and not q.get("citation"):
        raise ValidationError("official question must carry a citation")
    if q["origin"] == "ai" and q.get("citation"):
        raise ValidationError("AI question must not carry an official citation")
    fig = q.get("figure")
    if fig is not None:
        if not isinstance(fig, dict) or not isinstance(fig.get("svg"), str) or "<svg" not in fig["svg"]:
            raise ValidationError(f"figure must be an object with inline SVG markup: {q['id']}")


def validate_formula(f: dict) -> None:
    for k in ("id", "domain", "topic", "name", "formula", "explanation", "origin"):
        if k not in f:
            raise ValidationError(f"formula missing field: {k}")
    if f["origin"] == "official" and not f.get("citation"):
        raise ValidationError("official formula must carry a citation")


def validate_dataset(data: dict) -> bool:
    if "questions" not in data or "formulas" not in data:
        raise ValidationError("dataset must have 'questions' and 'formulas'")
    seen: set[str] = set()
    for q in data["questions"]:
        validate_question(q)
        if q["id"] in seen:
            raise ValidationError(f"duplicate question id: {q['id']}")
        seen.add(q["id"])
    for f in data["formulas"]:
        validate_formula(f)
    return True
