# sources/pdfs/ — official Campus IL PDFs

All 107 PDFs listed in `../campus_pdf_catalog.csv` belong here.

They are intentionally **not** fetched by the Claude environment, which cannot
reach `courses.campus.gov.il` (the domain is network-blocked, and the site
WAF-blocks server-side fetches — 403 on every URL, including the homepage). So
the files must be supplied from a machine that has access **and** your Campus IL
login, via one of:

1. `python3 ../download_campus_pdfs.py` (see `../README.md`), then drop the
   results here or into the Drive catalogue folder; or
2. upload them to the Drive catalogue folder — Claude will read them via the
   Drive integration and commit them here.

This directory is tracked (the parent `.gitignore` un-ignores `pdfs/*.pdf`).

**Copyright:** content belongs to המרכז הארצי לבחינות ולהערכה / Campus IL.
Personal study use only — keep this repository private and do not redistribute.
