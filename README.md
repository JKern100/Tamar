# הכנה לפסיכומטרי — Psychometric Study App

A Hebrew, fully-RTL study app for the Israeli psychometric entrance exam, built
from official **Campus IL** source PDFs. Runs as a single offline HTML file in the
browser — no server, no database, no install. For **personal study use**.

## What's here
- **`app/`** — the study app (Vite + React + TypeScript, builds to one offline
  `.html`). Modes: practice (מצב תרגול), formula sheet (דף נוסחאות), simulation
  (מצב סימולציה), review of mistakes (חזרה על טעויות), progress dashboard
  (לוח התקדמות), settings. Full test suite (`pnpm test`).
- **`ingestion/`** — Python pipeline that turns Campus IL PDFs into the app's
  structured data (PyMuPDF extraction + validation + assembly), with tests.
- **`sources/`** — catalog of the 107 official PDFs + a downloader. (The PDFs and
  extracted content are copyrighted and are **not** committed.)

## Core principles
- **Only Campus IL PDFs** back the official content; every official question and
  formula carries a source citation (file + page). Unbacked items are marked
  “לא אומת מתוך קובצי המקור”.
- **Official vs. AI is unmistakable** — enforced in the data model, validated in
  tests, and shown with distinct badges/framing in the UI. AI-generated practice
  is stored separately and always labeled “נוצר על ידי AI”.

## Build the app
```bash
cd app && pnpm install && pnpm build      # -> app/dist/index.html (demo data)
# with real content:
ingestion/build_app.sh ingestion/out/dataset.json
```

## Copyright
Official content belongs to המרכז הארצי לבחינות ולהערכה / Campus IL. Personal
study use only; do not redistribute the extracted content or the built app.
