# Ingestion pipeline

Turns Campus IL PDFs into the app's structured `dataset.json`. Extracted content
is copyrighted, so it is **never committed** — it is produced locally and bundled
only into the private app build.

## Flow
1. **Download** an accessible PDF (< 10 MB) from Drive → saved as JSON `{content: base64}`.
2. **Extract** text: `python3 extract.py <toolresult.json> out/<name>.txt [preview_page]`
   (PyMuPDF returns Hebrew in correct logical order — no reversal.)
3. **Structure** the extracted text into JSON fragments matching the app model
   (`questions[]` / `formulas[]`), each official item carrying a `citation`
   (pdfTitle + page). This step is LLM-assisted for reliability on Hebrew exam text.
4. **Assemble + validate**: `python3 assemble.py out/dataset.json out/frag1.json ...`
   — enforces official-vs-AI separation, citations, and answer-index ranges.
5. **Bundle**: copy `out/dataset.json` → `app/src/content/dataset.json`, then
   `pnpm build` in `app/` to produce the private single-file app.

## Notes
- The 20 full `סימולציה קמפוס` papers are ~12–13 MB and exceed the Drive bridge's
  10 MB cap; provide them re-saved under 10 MB to ingest them here, or extract on
  device. Course books, solution booklets, past exams, and formula sheets are all
  under the cap.
- `lib.py` holds extraction + the validation rules; `test_ingestion.py` covers them.
