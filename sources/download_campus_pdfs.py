#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מוריד את קובצי ה-PDF הרשמיים של Campus IL לפי הקטלוג ב-campus_pdf_catalog.csv.

חשוב: יש להריץ סקריפט זה בסביבה שבה יש גישה ל-courses.campus.gov.il ובה אתם
מחוברים (logged in) לקורס — למשל המחשב האישי שלכם. סביבת ההרצה של Claude חוסמת
את הדומיין הזה ברמת הרשת, ולכן ההורדה חייבת להתבצע אצלכם.

שימוש בסיסי:
    python3 download_campus_pdfs.py

עם עוגיית התחברות (אם הקבצים דורשים הרשאה), העתיקו את מחרוזת ה-Cookie
מכלי הפיתוח בדפדפן (DevTools → Network → בקשה כלשהי → Request Headers → cookie):
    CAMPUS_COOKIE="edxloggedin=true; sessionid=..." python3 download_campus_pdfs.py

הקבצים יישמרו לתיקייה sources/pdfs/ (שנמצאת ב-.gitignore ולא תעלה ל-Git).
לאחר מכן אפשר להעלות את התיקייה ל-Drive או להשאירה מקומית — כך האפליקציה תוכל
לקלוט אותם.
"""
import csv
import os
import sys
import time
from urllib.parse import unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, "campus_pdf_catalog.csv")
OUTDIR = os.path.join(HERE, "pdfs")
COURSE_REFERER = ("https://courses.campus.gov.il/courses/"
                  "course-v1:MSE+GOV_PsychometryHe+2018_1/")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


def filename_from_url(url):
    return unquote(url.rstrip("/").split("/")[-1]) or "file.pdf"


def main():
    if not os.path.exists(CATALOG):
        sys.exit(f"לא נמצא קטלוג: {CATALOG}")
    os.makedirs(OUTDIR, exist_ok=True)
    cookie = os.environ.get("CAMPUS_COOKIE", "").strip()

    with open(CATALOG, encoding="utf-8") as fh:
        rows = [r for r in csv.DictReader(fh) if r.get("url")]

    ok, skipped, failed = 0, 0, []
    for i, r in enumerate(rows, 1):
        title, url = r["title"], r["url"]
        dest = os.path.join(OUTDIR, filename_from_url(url))
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            skipped += 1
            print(f"[{i}/{len(rows)}] קיים, מדלג: {title}")
            continue
        headers = {"User-Agent": UA, "Referer": COURSE_REFERER,
                   "Accept": "application/pdf,*/*"}
        if cookie:
            headers["Cookie"] = cookie
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=60) as resp:
                data = resp.read()
            if not data.startswith(b"%PDF"):
                failed.append((title, "התוכן שהתקבל אינו PDF (ייתכן דף התחברות)"))
                print(f"[{i}/{len(rows)}] לא PDF: {title}")
                continue
            with open(dest, "wb") as out:
                out.write(data)
            ok += 1
            print(f"[{i}/{len(rows)}] הורד ({len(data)//1024} KB): {title}")
        except HTTPError as e:
            failed.append((title, f"HTTP {e.code}"))
            print(f"[{i}/{len(rows)}] נכשל HTTP {e.code}: {title}")
        except URLError as e:
            failed.append((title, str(e.reason)))
            print(f"[{i}/{len(rows)}] נכשל: {title} ({e.reason})")
        time.sleep(0.5)  # פנייה מנומסת לשרת

    print("\n=== סיכום ===")
    print(f"הורדו: {ok} | קיימים: {skipped} | נכשלו: {len(failed)}")
    if failed:
        print("\nכשלונות (ייתכן שנדרשת עוגיית התחברות CAMPUS_COOKIE):")
        for title, why in failed:
            print(f"  - {title}: {why}")


if __name__ == "__main__":
    main()
