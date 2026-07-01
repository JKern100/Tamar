#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract text from a Campus IL PDF (downloaded via the Drive MCP tool, which
saves large files as JSON {content: base64, title, ...}). PyMuPDF returns Hebrew
in correct logical order, so NO reversal is applied. Writes full per-page text to
an output file (kept out of the public repo) and prints a bounded preview.

Usage: extract.py <toolresult.json> <out.txt> [preview_page]
"""
import base64, json, sys
import fitz  # PyMuPDF

def main():
    json_path, out_txt = sys.argv[1], sys.argv[2]
    preview_page = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    with open(json_path, encoding="utf-8") as fh:
        data = json.load(fh)
    pdf = base64.b64decode(data["content"])
    doc = fitz.open(stream=pdf, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        pages.append(f"\n===== PAGE {i+1} =====\n" + page.get_text("text"))
    with open(out_txt, "w", encoding="utf-8") as fh:
        fh.write("".join(pages))
    print(f"TITLE: {data.get('title','?')}")
    print(f"PAGES: {doc.page_count}   -> wrote {out_txt}")
    # bounded preview of one page
    lines = [l for l in doc[preview_page].get_text("text").splitlines() if l.strip()]
    print(f"\n===== PREVIEW page {preview_page+1} (first 24 non-empty lines) =====")
    for l in lines[:24]:
        print(l)

if __name__ == "__main__":
    main()
