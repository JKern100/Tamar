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

## Large files (solving the Drive size/connection limit)
`download_file_content` returns the whole PDF as one base64 blob, which for files
over ~2.5 MB overflows the token limit and/or drops the connection. Workaround
that reliably pulls the big course books:

1. Use **`read_file_content`** instead — it returns Google's *text* extraction
   (~10x smaller payload), so 6–9 MB books come through where the base64 download
   crashes. (Output is saved to a tool-results JSON `{fileContent: string}`.)
2. Caveats: Google's extractor yields Hebrew in **reversed/visual order** (each
   word's letters reversed; digits normal; choices as `)1 ( ...`), and it
   **truncates** to roughly the first ~20 pages. So you get each book's opening
   practice sets, de-reversed by the structuring step.
3. Structure with a subagent that reconstructs the reversed Hebrew and, for math,
   **solves each question** to set the correct answer (more reliable than the key).

For complete books (full length, correct-order text via PyMuPDF), re-save them
under ~2.5 MB and use `download_file_content` + `extract.py` as usual.

- `lib.py` holds extraction + the validation rules; `test_ingestion.py` covers them.
