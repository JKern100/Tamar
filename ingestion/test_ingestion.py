# -*- coding: utf-8 -*-
import unittest
import fitz
from lib import extract_pages, validate_question, validate_formula, validate_dataset, ValidationError


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

    def test_dataset_valid(self):
        ai_q = {"id": "a1", "origin": "ai", "domain": "english", "topic": "Vocab",
                "stem": "?", "choices": ["a", "b"], "correctIndex": 0, "relatedOfficialId": "q1"}
        self.assertTrue(validate_dataset({"questions": [dict(VALID_Q), ai_q], "formulas": []}))


if __name__ == "__main__":
    unittest.main()
