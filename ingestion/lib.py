# -*- coding: utf-8 -*-
"""Ingestion helpers: PDF text extraction + dataset validation.

The validation mirrors the app's TypeScript model and enforces the data-integrity
rules: official items must carry a source citation, AI items must not masquerade
as official, and answer indices must be in range.
"""
import base64
import json
import fitz  # PyMuPDF

VALID_DOMAINS = {"quantitative", "verbal", "english", "writing"}
VALID_DIFF = {"easy", "medium", "hard"}


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
