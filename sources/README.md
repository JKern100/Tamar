# Sources — Campus IL psychometry PDFs

This folder holds **metadata and tooling** for the official source PDFs. It does
**not** hold the PDFs themselves (they're copyrighted — see below).

## Files
- `campus_pdf_catalog.csv` — flat `title,url` list of all 107 official PDFs
  (mirrored from the user's Drive catalog, which remains the source of truth).
- `source_inventory.csv` / `.json` — the same PDFs classified by domain, content
  type, what they contain, and intended use in the app.
- `SOURCE_INVENTORY.md` — human-readable Hebrew inventory table + summary counts.
- `download_campus_pdfs.py` — helper to fetch the PDFs **from an environment that
  has access + your login** (see below).
- `.gitignore` — blocks `pdfs/` and `*.pdf` so copyrighted files never enter git.

## Why the PDFs aren't fetched automatically
The Claude Code web environment cannot reach `courses.campus.gov.il`:
1. **Container egress** blocks the domain at the network layer (policy 403).
2. **Server-side fetch (WebFetch)** *does* reach the domain, but Campus IL's
   server returns **403 on every URL — including the public homepage** — i.e. it
   blocks non-Israeli / datacenter / non-authenticated requests at the WAF layer.
3. A headless browser wouldn't help — its traffic uses the same blocked egress.

So the PDF bytes must be provided from an environment that has access and your
Campus IL login.

## How to provide the PDFs (pick one)
1. **Manual (fastest for a first slice):** download the few PDFs you want from the
   course and drop them into the Drive folder that holds the catalog. They'll be
   readable via the Drive integration.
2. **Bulk via this script:** run `download_campus_pdfs.py` on your own machine
   while logged into the course. It reads the catalog and saves every PDF into
   `sources/pdfs/`. If a file needs your session, pass a cookie:
   `CAMPUS_COOKIE="sessionid=...; edxloggedin=true" python3 download_campus_pdfs.py`
3. **Via another agent with open internet** (e.g. Codex): have it download the
   PDFs and place them in the Drive folder, then this app ingests them.

## Copyright
Content belongs to המרכז הארצי לבחינות ולהערכה / Campus IL. Personal study use
only. Do not commit the PDFs or redistribute extracted content.
