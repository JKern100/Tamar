# -*- coding: utf-8 -*-
import unittest
import fitz
from lib import (
    extract_pages, validate_question, validate_formula, validate_dataset, ValidationError,
    fix_mirrored_parentheses, normalize_text_fields,
)


class TestExtraction(unittest.TestCase):
    def test_pdf_text_roundtrip(self):
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((72, 72), "Psychometry sample 123")
        pages = extract_pages(doc.tobytes())
        self.assertEqual(len(pages), 1)
        self.assertIn("Psychometry sample", pages[0])


VALID_Q = {
    "id": "q1", "origin": "official", "domain": "quantitative", "topic": "אחוזים",
    "stem": "?", "choices": ["a", "b", "c", "d"], "correctIndex": 1,
    "citation": {"pdfTitle": "ספר קורס", "page": 3},
}


class TestValidation(unittest.TestCase):
    def test_valid_question_passes(self):
        validate_question(dict(VALID_Q))

    def test_official_requires_citation(self):
        q = dict(VALID_Q); q.pop("citation")
        with self.assertRaises(ValidationError):
            validate_question(q)

    def test_ai_must_not_carry_official_citation(self):
        q = dict(VALID_Q); q["origin"] = "ai"
        with self.assertRaises(ValidationError):
            validate_question(q)

    def test_correct_index_range(self):
        q = dict(VALID_Q); q["correctIndex"] = 9
        with self.assertRaises(ValidationError):
            validate_question(q)

    def test_formula_official_requires_citation(self):
        with self.assertRaises(ValidationError):
            validate_formula({"id": "f", "domain": "quantitative", "topic": "t", "name": "n", "formula": "x", "explanation": "e", "origin": "official"})

    def test_dataset_rejects_duplicate_ids(self):
        data = {"questions": [dict(VALID_Q), dict(VALID_Q)], "formulas": []}
        with self.assertRaises(ValidationError):
            validate_dataset(data)

    def test_valid_figure_passes(self):
        q = dict(VALID_Q); q["figure"] = {"svg": "<svg viewBox='0 0 1 1'></svg>", "alt": "משולש"}
        validate_question(q)  # should not raise

    def test_figure_without_svg_rejected(self):
        q = dict(VALID_Q); q["figure"] = {"alt": "no svg here"}
        with self.assertRaises(ValidationError):
            validate_question(q)

    def test_dataset_valid(self):
        ai_q = {"id": "a1", "origin": "ai", "domain": "english", "topic": "Vocab",
                "stem": "?", "choices": ["a", "b"], "correctIndex": 0, "relatedOfficialId": "q1"}
        self.assertTrue(validate_dataset({"questions": [dict(VALID_Q), ai_q], "formulas": []}))


class TestBracketRepair(unittest.TestCase):
    def test_fixes_reversed_hebrew_gloss(self):
        self.assertEqual(fix_mirrored_parentheses("זחוח )שחצן( מפגין"), "זחוח (שחצן) מפגין")

    def test_fixes_multiple_islands_on_one_line(self):
        self.assertEqual(
            fix_mirrored_parentheses("זחוח )שחצן( מול )צניעות("),
            "זחוח (שחצן) מול (צניעות)",
        )

    def test_leaves_correct_math_untouched(self):
        # ')' here belongs to a correct pair; a naive swap would corrupt this.
        s = "2 כפול (x−3) שווה (x+4)−3"
        self.assertEqual(fix_mirrored_parentheses(s), s)

    def test_preserves_numbered_markers_across_lines(self):
        src = "זחוח )שחצן(.\n(1) פריט ראשון.\n(2) פריט שני."
        out = fix_mirrored_parentheses(src)
        self.assertIn("(שחצן)", out)
        self.assertIn("(1)", out)   # markers on other lines survive
        self.assertIn("(2)", out)
        self.assertEqual(out.count("("), out.count(")"))

    def test_plain_text_unchanged(self):
        self.assertEqual(fix_mirrored_parentheses("אין כאן סוגריים כלל"), "אין כאן סוגריים כלל")

    def test_normalize_walks_all_text_fields(self):
        data = {
            "questions": [{
                "id": "q", "origin": "official", "domain": "verbal", "topic": "t",
                "stem": "שור )הבט(?", "choices": ["א", "ב )ג("], "correctIndex": 0,
                "explanation": {"text": "כי )הבט( פירושו להסתכל.", "origin": "official"},
                "citation": {"pdfTitle": "x"},
            }],
            "formulas": [],
        }
        fixed = normalize_text_fields(data)
        self.assertEqual(fixed, 3)  # stem + one choice + explanation
        q = data["questions"][0]
        self.assertEqual(q["stem"], "שור (הבט)?")
        self.assertEqual(q["choices"][1], "ב (ג)")
        self.assertEqual(q["explanation"]["text"], "כי (הבט) פירושו להסתכל.")


if __name__ == "__main__":
    unittest.main()
